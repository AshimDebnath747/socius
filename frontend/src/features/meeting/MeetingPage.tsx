import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import CallEndIcon from "@mui/icons-material/CallEnd";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import HeadsetIcon from "@mui/icons-material/Headset";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import { socket } from "../../socket";
import api from "../../lib/axios";
import { getNextUserById, getUserProfile } from "../../services/user.service";

type PeerPayload = {
  socketId: string;
  userId: string | number;
  micEnabled?: boolean;
  cameraEnabled?: boolean;
  isScreenSharing?: boolean;
};
type SignalOffer = { offer: RTCSessionDescriptionInit; callerSocketId: string };
type SignalAnswer = { answer: RTCSessionDescriptionInit; responderSocketId: string };
type SignalCandidate = { candidate: RTCIceCandidateInit; senderSocketId: string };
type RemoteVideo = { socketId: string; stream: MediaStream };
type RemoteMediaState = { micEnabled: boolean; cameraEnabled: boolean; isScreenSharing?: boolean };

const describeMediaError = (error: unknown) => {
  if (!window.isSecureContext) {
    return "Camera and microphone require HTTPS or localhost. Open the app through a secure URL (such as your Cloudflare tunnel), then retry.";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "This browser does not provide camera and microphone access. Open the app in a supported browser over HTTPS, then retry.";
  }
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera or microphone access is blocked. Click the lock/tune icon next to localhost:5173 in your address bar and allow Camera/Microphone, then retry.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "No camera or webcam was detected on this computer. Connect a USB webcam or join from your mobile phone, then retry.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "The camera or microphone is busy in another app. Close the other app and retry.";
  }
  if (name === "OverconstrainedError") {
    return "The selected camera or microphone mode is unavailable on this device. Check your connected devices and retry.";
  }
  return "Could not open your camera and microphone. Check browser permissions and connected devices, then retry.";
};

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const useSpeakingActivity = (stream: MediaStream | null, micEnabled: boolean, cameraEnabled: boolean) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!stream || cameraEnabled || !micEnabled || !stream.getAudioTracks().some((track) => track.readyState === "live")) {
      return;
    }

    let audioContext: AudioContext | null = null;
    let animationFrame = 0;
    let speaking = false;
    let activeFrames = 0;
    let quietFrames = 0;
    try {
      audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const samples = new Uint8Array(analyser.fftSize);
      void audioContext.resume().catch(() => undefined);

      const readAudioLevel = () => {
        analyser.getByteTimeDomainData(samples);
        let squaredTotal = 0;
        for (const sample of samples) {
          const normalized = (sample - 128) / 128;
          squaredTotal += normalized * normalized;
        }
        const volume = Math.sqrt(squaredTotal / samples.length);
        if (volume > 0.045) {
          activeFrames += 1;
          quietFrames = 0;
          if (!speaking && activeFrames >= 3) {
            speaking = true;
            setIsSpeaking(true);
          }
        } else if (volume < 0.025) {
          quietFrames += 1;
          activeFrames = 0;
          if (speaking && quietFrames >= 30) {
            speaking = false;
            setIsSpeaking(false);
          }
        }
        animationFrame = window.requestAnimationFrame(readAudioLevel);
      };
      animationFrame = window.requestAnimationFrame(readAudioLevel);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        source.disconnect();
        analyser.disconnect();
        void audioContext?.close();
        setIsSpeaking(false);
      };
    } catch (cause) {
      console.error("Could not analyze meeting audio:", cause);
      return () => {
        window.cancelAnimationFrame(animationFrame);
        void audioContext?.close();
        setIsSpeaking(false);
      };
    }
  }, [cameraEnabled, micEnabled, stream]);

  return !cameraEnabled && micEnabled && isSpeaking;
};

const DraggablePipBox = ({
  children,
  onToggleSwap,
  containerRef,
}: {
  children: React.ReactNode;
  onToggleSwap: () => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0, moved: false });
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDefaultPos = () => {
      if (!containerRef.current || !boxRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const boxRect = boxRef.current.getBoundingClientRect();
      if (containerRect.width > 0 && containerRect.height > 0) {
        setPos((prev) => {
          if (prev === null) {
            return {
              x: Math.max(10, containerRect.width - boxRect.width - 16),
              y: Math.max(10, containerRect.height - boxRect.height - 16),
            };
          }
          const minX = 8;
          const maxX = Math.max(8, containerRect.width - boxRect.width - 8);
          const minY = 8;
          const maxY = Math.max(8, containerRect.height - boxRect.height - 8);
          return {
            x: Math.min(maxX, Math.max(minX, prev.x)),
            y: Math.min(maxY, Math.max(minY, prev.y)),
          };
        });
      }
    };

    updateDefaultPos();
    window.addEventListener("resize", updateDefaultPos);
    return () => window.removeEventListener("resize", updateDefaultPos);
  }, [containerRef]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    const boxRect = boxRef.current?.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!boxRect || !containerRect) return;

    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: pos ? pos.x : containerRect.width - boxRect.width - 16,
      initialY: pos ? pos.y : containerRect.height - boxRect.height - 16,
      moved: false,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging || !containerRef.current || !boxRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    if (Math.hypot(dx, dy) > 4) {
      dragRef.current.moved = true;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const boxRect = boxRef.current.getBoundingClientRect();
    const minX = 8;
    const maxX = Math.max(8, containerRect.width - boxRect.width - 8);
    const minY = 8;
    const maxY = Math.max(8, containerRect.height - boxRect.height - 8);

    const nextX = Math.min(maxX, Math.max(minX, dragRef.current.initialX + dx));
    const nextY = Math.min(maxY, Math.max(minY, dragRef.current.initialY + dy));

    setPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

    if (!dragRef.current.moved) {
      onToggleSwap();
    }
  };

  return (
    <Box
      ref={boxRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      sx={{
        position: "absolute",
        left: pos ? `${pos.x}px` : "auto",
        top: pos ? `${pos.y}px` : "auto",
        right: pos ? "auto" : { xs: 10, sm: 16 },
        bottom: pos ? "auto" : { xs: 10, sm: 16 },
        width: { xs: 110, sm: 150, md: 220 },
        height: { xs: 150, sm: 200, md: 150 },
        borderRadius: "14px",
        overflow: "hidden",
        boxShadow: "0 10px 32px rgba(0,0,0,0.85)",
        border: "2px solid rgba(255,255,255,0.25)",
        zIndex: 25,
        cursor: "grab",
        userSelect: "none",
        touchAction: "none",
        "&:active": { cursor: "grabbing" },
        transition: dragRef.current.isDragging ? "none" : "box-shadow 200ms ease",
      }}
    >
      {children}
      <Box
        sx={{
          position: "absolute",
          top: 6,
          right: 6,
          bgcolor: "rgba(0,0,0,0.65)",
          color: "rgba(255,255,255,0.85)",
          borderRadius: "6px",
          p: "2px 5px",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          pointerEvents: "none",
          fontSize: 10,
          fontWeight: 600,
        }}
      >
        <SyncAltIcon sx={{ fontSize: 12 }} />
        <span>Swap</span>
      </Box>
    </Box>
  );
};

const MeetingPage = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isVoiceMode = searchParams.get("mode") === "voice";
  const navigate = useNavigate();
  const showCameraSwitch = isMobileDevice();
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const stageContainerRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceCandidates = useRef(new Map<string, RTCIceCandidateInit[]>());
  const [remoteVideos, setRemoteVideos] = useState<RemoteVideo[]>([]);
  const [participantName, setParticipantName] = useState(() => {
    return (
      (location.state as any)?.peerName ||
      searchParams.get("peerName") ||
      "Other participant"
    );
  });
  const [participantAvatar, setParticipantAvatar] = useState<string | null>(() => {
    return (
      (location.state as any)?.peerAvatar ||
      searchParams.get("peerAvatar") ||
      null
    );
  });
  const [localProfile, setLocalProfile] = useState<{ name: string; avatar: string | null }>({ name: "You", avatar: null });
  const [remoteMediaStates, setRemoteMediaStates] = useState<Record<string, RemoteMediaState>>({});
  const [status, setStatus] = useState("Joining meeting…");
  const [error, setError] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(!isVoiceMode);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mediaReady, setMediaReady] = useState(false);
  const [canRetryMedia, setCanRetryMedia] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [switchingCamera, setSwitchingCamera] = useState(false);
  const [isSwapped, setIsSwapped] = useState(false);

  // Audio output device selection
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>("");
  const [speakerMenuAnchor, setSpeakerMenuAnchor] = useState<null | HTMLElement>(null);
  const [isLoudspeaker, setIsLoudspeaker] = useState(true);
  const localIsSpeaking = useSpeakingActivity(localStreamRef.current, micEnabled, cameraEnabled);

  useEffect(() => {
    const getOutputs = async () => {
      try {
        if (!navigator.mediaDevices?.enumerateDevices) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === "audiooutput");
        setAudioOutputs(outputs);
        if (outputs.length > 0 && !selectedAudioOutput) {
          setSelectedAudioOutput(outputs[0].deviceId);
        }
      } catch (err) {
        console.warn("Could not enumerate audio outputs:", err);
      }
    };
    void getOutputs();
    navigator.mediaDevices?.addEventListener?.("devicechange", getOutputs);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", getOutputs);
    };
  }, [selectedAudioOutput]);

  const handleSelectAudioOutput = async (deviceId: string) => {
    setSelectedAudioOutput(deviceId);
    setSpeakerMenuAnchor(null);
    const selectedDev = audioOutputs.find((d) => d.deviceId === deviceId);
    if (selectedDev) {
      setIsLoudspeaker(!/headset|earpiece|headphone|bluetooth/i.test(selectedDev.label));
    }
    try {
      const mediaElements = document.querySelectorAll<HTMLMediaElement>("video, audio");
      for (const el of Array.from(mediaElements)) {
        if (typeof (el as any).setSinkId === "function") {
          await (el as any).setSinkId(deviceId);
        }
      }
    } catch (err) {
      console.warn("Could not set audio sink:", err);
    }
  };


  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (meetingContainerRef.current) {
          await meetingContainerRef.current.requestFullscreen();
        }
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen toggle failed:", err);
    }
  };

  const isScreenSharingRef = useRef(false);
  isScreenSharingRef.current = isScreenSharing;

  const replaceOutgoingVideo = useCallback(async (track: MediaStreamTrack) => {
    for (const [targetSocketId, peer] of peerConnections.current.entries()) {
      let videoSender: RTCRtpSender | undefined;
      let renegotiate = false;
      if (typeof peer.getTransceivers === "function") {
        const transceivers = peer.getTransceivers().filter(
          (t) => t.receiver?.track?.kind === "video" || t.sender?.track?.kind === "video"
        );
        if (transceivers.length > 0) {
          videoSender = transceivers[0].sender;
          if (transceivers[0].direction === "recvonly" || transceivers[0].direction === "inactive") {
            transceivers[0].direction = "sendrecv";
            renegotiate = true;
          }
        }
      }
      if (!videoSender) {
        videoSender = peer.getSenders().find((s) => s.track?.kind === "video");
      }

      if (videoSender) {
        await videoSender.replaceTrack(track);
      } else {
        const stream = screenStreamRef.current || localStreamRef.current;
        if (stream) {
          peer.addTrack(track, stream);
          renegotiate = true;
        }
      }

      if (renegotiate && peer.signalingState === "stable") {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit("webrtc-offer", { targetSocketId, offer });
      }
    }
  }, []);

  const stopScreenShare = useCallback(async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    // Restore webcam track to senders
    const webcamTrack = localStreamRef.current?.getVideoTracks()[0];
    if (webcamTrack) {
      webcamTrack.enabled = cameraEnabled;
      await replaceOutgoingVideo(webcamTrack);
    }

    socket.emit("meeting-media-state", {
      micEnabled,
      cameraEnabled,
      isScreenSharing: false,
    });
  }, [cameraEnabled, micEnabled, replaceOutgoingVideo]);

  const startScreenShare = async () => {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("Screen sharing is not supported in this browser.");
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) {
        throw new Error("No screen video track was provided.");
      }

      screenStreamRef.current = displayStream;
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        void stopScreenShare();
      };

      await replaceOutgoingVideo(screenTrack);

      socket.emit("meeting-media-state", {
        micEnabled,
        cameraEnabled,
        isScreenSharing: true,
      });
      setError("");
    } catch (err: unknown) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError" || name === "AbortError") {
        return;
      }
      console.error("Screen share error:", err);
      setError("Could not start screen sharing. Check permissions and try again.");
    }
  };

  const toggleScreenShare = () => {
    if (isScreenSharing) {
      void stopScreenShare();
    } else {
      void startScreenShare();
    }
  };

  const createPeerConnection = useCallback((remoteSocketId: string) => {
    const existing = peerConnections.current.get(remoteSocketId);
    if (existing) return existing;

    const peer = new RTCPeerConnection(rtcConfiguration);
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { targetSocketId: remoteSocketId, candidate });
    };
    peer.ontrack = (event) => {
      let stream = event.streams[0];
      if (!stream) {
        stream = new MediaStream([event.track]);
      } else if (!stream.getTracks().some((t) => t.id === event.track.id)) {
        stream.addTrack(event.track);
      }
      setRemoteVideos((videos) => [
        ...videos.filter((video) => video.socketId !== remoteSocketId),
        { socketId: remoteSocketId, stream },
      ]);
    };
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === "failed") {
        setStatus("Connection failed. Check your network and try rejoining.");
      }
    };

    const activeVideoTrack = isScreenSharingRef.current && screenStreamRef.current
      ? screenStreamRef.current.getVideoTracks()[0]
      : localStreamRef.current?.getVideoTracks()[0];
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack && localStreamRef.current) peer.addTrack(audioTrack, localStreamRef.current);
    if (activeVideoTrack) {
      const streamForTrack = isScreenSharingRef.current && screenStreamRef.current
        ? screenStreamRef.current
        : localStreamRef.current!;
      peer.addTrack(activeVideoTrack, streamForTrack);
    } else {
      try {
        peer.addTransceiver("video", { direction: "sendrecv" });
      } catch (err) {
        console.warn("Could not add video transceiver:", err);
      }
    }

    peerConnections.current.set(remoteSocketId, peer);
    return peer;
  }, []);

  const startOffer = useCallback(async (remoteSocketId: string) => {
    const peer = createPeerConnection(remoteSocketId);
    if (peer.signalingState !== "stable") return;
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    socket.emit("webrtc-offer", { targetSocketId: remoteSocketId, offer });
  }, [createPeerConnection]);

  useEffect(() => {
    if (!roomId) {
      setError("This meeting link is missing its session ID.");
      return;
    }
    let cancelled = false;
    setMediaReady(false);
    setCanRetryMedia(false);

    const removePeer = (socketId: string) => {
      peerConnections.current.get(socketId)?.close();
      peerConnections.current.delete(socketId);
      pendingIceCandidates.current.delete(socketId);
      setRemoteVideos((videos) => videos.filter((video) => video.socketId !== socketId));
      setRemoteMediaStates((states) => {
        const remaining = { ...states };
        delete remaining[socketId];
        return remaining;
      });
    };
    const updateRemoteMediaState = (socketId: string, state: Partial<RemoteMediaState>) => {
      setRemoteMediaStates((states) => ({
        ...states,
        [socketId]: {
          micEnabled: state.micEnabled ?? states[socketId]?.micEnabled ?? true,
          cameraEnabled: state.cameraEnabled ?? states[socketId]?.cameraEnabled ?? true,
          isScreenSharing: state.isScreenSharing ?? states[socketId]?.isScreenSharing ?? false,
        },
      }));
    };
    const handleNewUser = ({ socketId, micEnabled, cameraEnabled, isScreenSharing }: PeerPayload) => {
      updateRemoteMediaState(socketId, { micEnabled, cameraEnabled, isScreenSharing });
      void startOffer(socketId).catch((cause: unknown) => {
        console.error("Could not start peer connection:", cause);
        setError("Could not connect to the other participant.");
      });
    };
    const handleUsersAlreadyThere = (users: PeerPayload[]) => {
      users.forEach(({ socketId, micEnabled, cameraEnabled, isScreenSharing }) => {
        updateRemoteMediaState(socketId, { micEnabled, cameraEnabled, isScreenSharing });
      });
      setStatus(users.length ? "Connecting to the other participant…" : "You’re in the meeting. Waiting for the other participant…");
    };
    const handleUserLeft = ({ socketId }: { socketId: string }) => removePeer(socketId);
    const handleRemoteMediaState = ({ socketId, micEnabled, cameraEnabled, isScreenSharing }: PeerPayload) => {
      updateRemoteMediaState(socketId, { micEnabled, cameraEnabled, isScreenSharing });
    };

    const handleOffer = async ({ offer, callerSocketId }: SignalOffer) => {
      try {
        const peer = createPeerConnection(callerSocketId);
        await peer.setRemoteDescription(offer);
        for (const candidate of pendingIceCandidates.current.get(callerSocketId) ?? []) {
          await peer.addIceCandidate(candidate);
        }
        pendingIceCandidates.current.delete(callerSocketId);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit("webrtc-answer", { targetSocketId: callerSocketId, answer });
        setStatus("Connected to the other participant.");
      } catch (cause) {
        console.error("Could not answer meeting offer:", cause);
        setError("Could not establish the meeting connection.");
      }
    };
    const handleAnswer = async ({ answer, responderSocketId }: SignalAnswer) => {
      const peer = peerConnections.current.get(responderSocketId);
      if (!peer || peer.signalingState !== "have-local-offer") return;
      try {
        await peer.setRemoteDescription(answer);
        for (const candidate of pendingIceCandidates.current.get(responderSocketId) ?? []) {
          await peer.addIceCandidate(candidate);
        }
        pendingIceCandidates.current.delete(responderSocketId);
        setStatus("Connected to the other participant.");
      } catch (cause) {
        console.error("Could not apply meeting answer:", cause);
        setError("Could not establish the meeting connection.");
      }
    };
    const handleIceCandidate = async ({ candidate, senderSocketId }: SignalCandidate) => {
      const peer = peerConnections.current.get(senderSocketId);
      if (!peer || !peer.remoteDescription) {
        const pending = pendingIceCandidates.current.get(senderSocketId) ?? [];
        pending.push(candidate);
        pendingIceCandidates.current.set(senderSocketId, pending);
        return;
      }
      try {
        await peer.addIceCandidate(candidate);
      } catch (cause) {
        console.error("Could not apply ICE candidate:", cause);
      }
    };
    const handleMeetingError = ({ message }: { message: string }) => setError(message);

    const handleSessionEnded = ({ sessionId }: { sessionId: number }) => {
      if (Number(sessionId) === Number(roomId)) {
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => {});
        }
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach((track) => track.stop());
          screenStreamRef.current = null;
        }
        setIsScreenSharing(false);
        setError("This session has been ended. The meeting is now closed.");
        setStatus("Meeting closed");
        peerConnections.current.forEach((peer) => peer.close());
        peerConnections.current.clear();
        pendingIceCandidates.current.clear();
        setRemoteVideos([]);
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
        setMediaReady(false);
        setTimeout(() => {
          navigate(`/chat?sessionId=${roomId}`);
        }, 1500);
      }
    };

    const handleCallRejected = ({ sessionId }: { sessionId: number }) => {
      if (Number(sessionId) === Number(roomId)) {
        setStatus("Call declined");
        setError("The other participant declined the call.");
        setTimeout(() => {
          navigate(`/chat?sessionId=${roomId}`);
        }, 1800);
      }
    };

    const handleCallEnded = ({ sessionId }: { sessionId: number }) => {
      if (Number(sessionId) === Number(roomId)) {
        setStatus("Call ended");
        setError("The call has ended.");
        setTimeout(() => {
          navigate(`/chat?sessionId=${roomId}`);
        }, 1400);
      }
    };

    socket.on("new-user-joined", handleNewUser);
    socket.on("users-already-in-meeting", handleUsersAlreadyThere);
    socket.on("user-left-meeting", handleUserLeft);
    socket.on("meeting-media-state", handleRemoteMediaState);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("meeting-error", handleMeetingError);
    socket.on("session-ended", handleSessionEnded);
    socket.on("call-rejected", handleCallRejected);
    socket.on("call-ended", handleCallEnded);

    const joinMeeting = async () => {
      let sessionValidated = false;
      try {
        const sessionResponse = await api.get(`/api/sessions/${roomId}`);
        sessionValidated = true;
        const session = sessionResponse.data?.data as {
          status?: string;
          helper_id?: number;
          requester_id?: number;
          peer_name?: string;
          peer_avatar?: string;
        } | undefined;
        if (session?.status !== "active") {
          setError("This session has ended and its meeting is closed.");
          setStatus("Meeting unavailable");
          return;
        }
        setParticipantName(session.peer_name || "Other participant");
        setParticipantAvatar(session.peer_avatar ?? null);
        void getUserProfile()
          .then((profile) => {
            if (!cancelled && profile?.user) {
              setLocalProfile({ name: profile.user.name || "You", avatar: profile.user.avatar ?? null });
            }
          })
          .catch((cause: unknown) => {
            console.error("Could not load your meeting profile:", cause);
          });
        if (session.helper_id != null && session.requester_id != null) {
          void getNextUserById(session.helper_id, session.requester_id)
            .then((participant) => {
              if (cancelled || !participant) return;
              if (participant.name) setParticipantName(participant.name);
              if (participant.avatar) setParticipantAvatar(participant.avatar);
            })
            .catch((cause: unknown) => {
              console.error("Could not load meeting participant:", cause);
            });
        }
        if (!window.isSecureContext) {
          throw new Error("Camera and microphone require a secure page.");
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Media capture is unavailable in this browser.");
        }
        let stream: MediaStream;
        const currentLive = localStreamRef.current;
        const hasLiveVideo = Boolean(currentLive && currentLive.getVideoTracks().some((t) => t.readyState === "live"));
        const hasLiveAudio = Boolean(currentLive && currentLive.getAudioTracks().some((t) => t.readyState === "live"));

        if (isVoiceMode && hasLiveAudio && currentLive) {
          currentLive.getVideoTracks().forEach((t) => t.stop());
          stream = currentLive;
        } else if (!isVoiceMode && hasLiveVideo && hasLiveAudio && currentLive) {
          stream = currentLive;
        } else if (isVoiceMode) {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
            video: false,
          });
          setCameraEnabled(false);
          setStatus("Connected (Voice call; camera is off)");
        } else {
          const videoConstraints = showCameraSwitch ? { facingMode: { ideal: "user" } } : true;
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: videoConstraints,
            });
            setCameraEnabled(true);
            setCameraFacing("user");
          } catch (mediaError) {
            const mediaErrorName = mediaError instanceof DOMException ? mediaError.name : "";
            console.warn("Video capture failed; attempting audio-only fallback:", mediaError);
            try {
              stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
              setCameraEnabled(false);
              if (mediaErrorName === "NotAllowedError" || mediaErrorName === "SecurityError") {
                setError("Camera permission is blocked by your browser. Joined with microphone only. To allow camera, click the lock/tune icon in the address bar (next to localhost:5173) and set Camera to 'Allow'.");
              } else if (mediaErrorName === "NotFoundError" || mediaErrorName === "DevicesNotFoundError") {
                setError("No camera/webcam was detected on this PC. Joined with microphone only. Connect a USB webcam or join from your mobile device to share video.");
              } else {
                setStatus("Camera unavailable; joined with microphone only.");
              }
            } catch {
              throw mediaError;
            }
          }
        }
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);
        setMediaReady(true);
        socket.emit("join-meeting", roomId, {
          micEnabled: stream.getAudioTracks().some((track) => track.enabled),
          cameraEnabled: stream.getVideoTracks().some((track) => track.enabled),
          isScreenSharing,
          callMode: isVoiceMode ? "voice" : "video",
        }, (result: { success: boolean; message?: string }) => {
          if (!result.success) {
            setError(result.message ?? "Could not join this meeting.");
            setStatus("Meeting unavailable");
          }
        });
      } catch (cause) {
        console.error("Could not join meeting:", cause);
        const message = sessionValidated
          ? describeMediaError(cause)
          : "This active session is unavailable or you are not a participant.";
        setCanRetryMedia(sessionValidated);
        setError(message);
        setStatus("Unable to join meeting");
      }
    };

    const handleConnect = () => {
      void joinMeeting();
    };

    if (socket.connected) void joinMeeting();
    socket.on("connect", handleConnect);

    const currentPeers = peerConnections.current;
    const currentPendingIce = pendingIceCandidates.current;

    return () => {
      cancelled = true;
      if (document.fullscreenElement) {
        void document.exitFullscreen().catch(() => {});
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      socket.off("connect", handleConnect);
      socket.off("new-user-joined", handleNewUser);
      socket.off("users-already-in-meeting", handleUsersAlreadyThere);
      socket.off("user-left-meeting", handleUserLeft);
      socket.off("meeting-media-state", handleRemoteMediaState);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("meeting-error", handleMeetingError);
      socket.off("session-ended", handleSessionEnded);
      socket.off("call-rejected", handleCallRejected);
      socket.off("call-ended", handleCallEnded);
      socket.emit("leave-meeting");
      currentPeers.forEach((peer) => peer.close());
      currentPeers.clear();
      currentPendingIce.clear();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setMediaReady(false);
    };
  }, [roomId, retryCount]);

  const toggleMic = () => {
    const next = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = next; });
    setMicEnabled(next);
    socket.emit("meeting-media-state", { micEnabled: next, cameraEnabled, isScreenSharing });
  };
  const toggleCamera = async () => {
    if (isScreenSharing) return;
    const next = !cameraEnabled;
    const currentStream = localStreamRef.current;
    const videoTrack = currentStream?.getVideoTracks()[0];

    if (next && (!videoTrack || videoTrack.readyState === "ended")) {
      const videoConstraints = showCameraSwitch ? { facingMode: { ideal: cameraFacing } } : true;
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
        });
        const newTrack = videoStream.getVideoTracks()[0];
        if (newTrack) {
          const nextStream = new MediaStream([
            ...(currentStream ? currentStream.getAudioTracks() : []),
            newTrack,
          ]);
          localStreamRef.current = nextStream;
          setLocalStream(nextStream);
          await replaceOutgoingVideo(newTrack);
          setCameraEnabled(true);
          setError("");
          socket.emit("meeting-media-state", { micEnabled, cameraEnabled: true, isScreenSharing });
        }
      } catch (err) {
        console.error("Could not turn on camera:", err);
        const errName = err instanceof DOMException ? err.name : "";
        if (errName === "NotAllowedError" || errName === "SecurityError") {
          setError("Camera permission is blocked in your browser. Click the lock/tune icon next to localhost:5173 in the address bar and allow Camera access.");
        } else if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
          setError("No camera/webcam was detected on this PC. Please connect a USB webcam or join from your mobile device.");
        } else {
          setError("Could not access camera. Check device permissions.");
        }
      }
      return;
    }

    if (videoTrack) {
      videoTrack.enabled = next;
    }
    setCameraEnabled(next);
    socket.emit("meeting-media-state", { micEnabled, cameraEnabled: next, isScreenSharing });
  };
  const switchCamera = async () => {
    const currentStream = localStreamRef.current;
    if (!currentStream || switchingCamera || isScreenSharing) return;

    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    const currentTrack = currentStream.getVideoTracks()[0];
    if (!currentTrack) return;

    const buildStream = (track: MediaStreamTrack) => new MediaStream([
      ...currentStream.getAudioTracks(),
      track,
    ]);

    let replacementStream: MediaStream | null = null;
    setSwitchingCamera(true);
    try {
      const cameras = (await navigator.mediaDevices.enumerateDevices())
        .filter((device) => device.kind === "videoinput");
      const currentDeviceId = currentTrack.getSettings().deviceId;
      const facingLabel = nextFacing === "environment"
        ? /back|rear|environment|world/i
        : /front|user|facetime/i;
      const otherCamera = cameras.find((device) =>
        device.deviceId !== currentDeviceId && facingLabel.test(device.label),
      ) ?? cameras.find((device) => device.deviceId !== currentDeviceId);
      const videoConstraint: MediaTrackConstraints = otherCamera
        ? { deviceId: { exact: otherCamera.deviceId } }
        : { facingMode: { exact: nextFacing } };

      const openTargetCamera = () => navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraint,
      });

      try {
        replacementStream = await openTargetCamera();
      } catch (firstError) {
        currentTrack.stop();
        try {
          replacementStream = await openTargetCamera();
        } catch (switchError) {
          const previousConstraint: MediaTrackConstraints = currentDeviceId
            ? { deviceId: { exact: currentDeviceId } }
            : { facingMode: { ideal: cameraFacing } };
          try {
            const restoredStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: previousConstraint,
            });
            const restoredTrack = restoredStream.getVideoTracks()[0];
            if (restoredTrack) {
              restoredTrack.enabled = cameraEnabled;
              await replaceOutgoingVideo(restoredTrack);
              const nextStream = buildStream(restoredTrack);
              localStreamRef.current = nextStream;
            }
          } catch (restoreError) {
            console.error("Could not restore the original camera:", restoreError);
          }
          throw switchError ?? firstError;
        }
      }

      const replacementTrack = replacementStream.getVideoTracks()[0];
      if (!replacementTrack) throw new Error("No camera track was returned.");
      replacementTrack.enabled = cameraEnabled;
      await replaceOutgoingVideo(replacementTrack);

      const nextStream = buildStream(replacementTrack);
      currentStream.getVideoTracks().filter((track) => track !== currentTrack).forEach((track) => track.stop());
      if (currentTrack.readyState !== "ended") currentTrack.stop();
      localStreamRef.current = nextStream;
      setCameraFacing(nextFacing);
      setError("");
    } catch (cause) {
      replacementStream?.getTracks().forEach((track) => track.stop());
      console.error("Could not switch camera:", cause);
      setError("Could not switch camera. Check camera permissions or whether the other camera is available.");
    } finally {
      setSwitchingCamera(false);
    }
  };

  const leaveMeeting = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);
    socket.emit("leave-meeting");
    navigate(`/chat?sessionId=${roomId}`);
  };

  const remoteScreenSharer = remoteVideos.find((v) => remoteMediaStates[v.socketId]?.isScreenSharing);

  return (
    <Box
      ref={meetingContainerRef}
      sx={{
        height: isFullscreen ? "100vh" : { xs: "calc(100dvh - 58px)", md: "calc(100dvh - 68px)" },
        minHeight: { xs: 0, md: 420 },
        display: "flex",
        flexDirection: "column",
        bgcolor: "#111318",
        color: "#E3E3E3",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, p: { xs: 1, sm: 2 }, display: "flex", flexDirection: "column", gap: { xs: 1, sm: 1.5 } }}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Typography textAlign="center" color="#C4C7C5" variant="body2">{status}</Typography>

        {/* Video Presentation Area */}
        {remoteScreenSharer ? (
          /* Presentation Mode: Remote user is sharing their screen */
          <Box sx={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
            <Box sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Chip
                icon={<ScreenShareIcon sx={{ fontSize: 16 }} />}
                label={`${participantName} is sharing their screen`}
                color="info"
                size="small"
                sx={{ px: 1, fontWeight: 500 }}
              />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, position: "relative", width: "100%", height: "100%" }}>
              <RemoteVideoTile
                socketId={remoteScreenSharer.socketId}
                stream={remoteScreenSharer.stream}
                name={participantName}
                avatar={participantAvatar}
                cameraEnabled={remoteMediaStates[remoteScreenSharer.socketId]?.cameraEnabled ?? true}
                micEnabled={remoteMediaStates[remoteScreenSharer.socketId]?.micEnabled ?? true}
                isScreenSharing={true}
              />
              {/* Picture-in-Picture Local Participant Tile */}
              <Box
                sx={{
                  position: "absolute",
                  right: { xs: 10, sm: 16 },
                  bottom: { xs: 10, sm: 16 },
                  width: { xs: 120, sm: 170, md: 220 },
                  height: { xs: 80, sm: 115, md: 145 },
                  borderRadius: "10px",
                  overflow: "hidden",
                  boxShadow: "0 8px 30px rgba(0,0,0,0.85)",
                  border: "2px solid rgba(255,255,255,0.25)",
                  zIndex: 10,
                }}
              >
                <LocalVideoTile
                  stream={localStream}
                  cameraEnabled={cameraEnabled}
                  mediaReady={mediaReady}
                  cameraFacing={cameraFacing}
                  isScreenSharing={false}
                  localProfile={localProfile}
                  localIsSpeaking={localIsSpeaking}
                  isPip={true}
                />
              </Box>
            </Box>
          </Box>
        ) : isScreenSharing ? (
          /* Presentation Mode: Local user is sharing their screen */
          <Box sx={{ flex: 1, minHeight: 0, position: "relative", display: "flex", flexDirection: "column" }}>
            <Box sx={{ mb: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
              <Chip
                icon={<ScreenShareIcon sx={{ fontSize: 16 }} />}
                label="You are sharing your screen"
                color="primary"
                size="small"
                onDelete={stopScreenShare}
                deleteIcon={<StopScreenShareIcon />}
                sx={{ px: 1, fontWeight: 500 }}
              />
            </Box>
            <Box sx={{ flex: 1, minHeight: 0, position: "relative", width: "100%", height: "100%" }}>
              <LocalVideoTile
                stream={screenStreamRef.current}
                cameraEnabled={cameraEnabled}
                mediaReady={mediaReady}
                cameraFacing={cameraFacing}
                isScreenSharing={true}
                localProfile={localProfile}
                localIsSpeaking={localIsSpeaking}
              />
              {/* Picture-in-Picture Remote Participant Tile */}
              {remoteVideos.length > 0 && (
                <Box
                  sx={{
                    position: "absolute",
                    right: { xs: 10, sm: 16 },
                    bottom: { xs: 10, sm: 16 },
                    width: { xs: 120, sm: 170, md: 220 },
                    height: { xs: 80, sm: 115, md: 145 },
                    borderRadius: "10px",
                    overflow: "hidden",
                    boxShadow: "0 8px 30px rgba(0,0,0,0.85)",
                    border: "2px solid rgba(255,255,255,0.25)",
                    zIndex: 10,
                  }}
                >
                  <RemoteVideoTile
                    socketId={remoteVideos[0].socketId}
                    stream={remoteVideos[0].stream}
                    name={participantName}
                    avatar={participantAvatar}
                    cameraEnabled={remoteMediaStates[remoteVideos[0].socketId]?.cameraEnabled ?? true}
                    micEnabled={remoteMediaStates[remoteVideos[0].socketId]?.micEnabled ?? true}
                    isScreenSharing={false}
                    isPip={true}
                  />
                </Box>
              )}
            </Box>
          </Box>
        ) : (
          /* WhatsApp-Style 1-on-1 Call: Main Full-Screen Stage + Floating Draggable Swappable PIP */
          <Box
            ref={stageContainerRef}
            sx={{
              flex: 1,
              minHeight: 0,
              position: "relative",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: "16px",
              bgcolor: "#14171C",
            }}
          >
            {/* Main Stage (100% full view) */}
            <Box sx={{ width: "100%", height: "100%", position: "absolute", inset: 0 }}>
              {!isSwapped ? (
                /* Primary view: Remote participant */
                remoteVideos.length > 0 ? (
                  <RemoteVideoTile
                    socketId={remoteVideos[0].socketId}
                    stream={remoteVideos[0].stream}
                    name={participantName}
                    avatar={participantAvatar}
                    cameraEnabled={remoteMediaStates[remoteVideos[0].socketId]?.cameraEnabled ?? true}
                    micEnabled={remoteMediaStates[remoteVideos[0].socketId]?.micEnabled ?? true}
                    isScreenSharing={false}
                  />
                ) : (
                  <Paper
                    sx={{
                      width: "100%",
                      height: "100%",
                      bgcolor: "#191C20",
                      display: "grid",
                      placeItems: "center",
                      color: "#C4C7C5",
                      border: "1px solid rgba(255,255,255,.1)",
                    }}
                  >
                    <Stack alignItems="center" spacing={2}>
                      <ParticipantAvatar
                        name={participantName}
                        avatar={participantAvatar}
                        isSpeaking={false}
                        size="normal"
                      />
                      <Typography variant="h6" fontWeight={600} color="#FFFFFF">
                        {participantName}
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CircularProgress size={20} sx={{ color: "#22c55e" }} />
                        <Typography variant="body2" color="#A0AEC0">
                          Ringing / Waiting to connect…
                        </Typography>
                      </Stack>
                    </Stack>
                  </Paper>
                )
              ) : (
                /* Swapped: Primary view is Local participant */
                <LocalVideoTile
                  stream={localStream}
                  cameraEnabled={cameraEnabled}
                  mediaReady={mediaReady}
                  cameraFacing={cameraFacing}
                  isScreenSharing={false}
                  localProfile={localProfile}
                  localIsSpeaking={localIsSpeaking}
                />
              )}
            </Box>

            {/* Draggable & Tap-to-Swap Floating PIP Window */}
            <DraggablePipBox
              containerRef={stageContainerRef}
              onToggleSwap={() => setIsSwapped((prev) => !prev)}
            >
              {!isSwapped ? (
                /* PIP is Local user */
                <LocalVideoTile
                  stream={localStream}
                  cameraEnabled={cameraEnabled}
                  mediaReady={mediaReady}
                  cameraFacing={cameraFacing}
                  isScreenSharing={false}
                  localProfile={localProfile}
                  localIsSpeaking={localIsSpeaking}
                  isPip={true}
                />
              ) : (
                /* Swapped: PIP is Remote participant */
                remoteVideos.length > 0 ? (
                  <RemoteVideoTile
                    socketId={remoteVideos[0].socketId}
                    stream={remoteVideos[0].stream}
                    name={participantName}
                    avatar={participantAvatar}
                    cameraEnabled={remoteMediaStates[remoteVideos[0].socketId]?.cameraEnabled ?? true}
                    micEnabled={remoteMediaStates[remoteVideos[0].socketId]?.micEnabled ?? true}
                    isScreenSharing={false}
                    isPip={true}
                  />
                ) : (
                  <Box sx={{ width: "100%", height: "100%", bgcolor: "#191C20", display: "grid", placeItems: "center" }}>
                    <ParticipantAvatar
                      name={participantName}
                      avatar={participantAvatar}
                      isSpeaking={false}
                      size="small"
                    />
                  </Box>
                )
              )}
            </DraggablePipBox>
          </Box>
        )}

        {/* Controls Toolbar */}
        <Stack direction="row" justifyContent="center" spacing={{ xs: 1, sm: 1.5 }} sx={{ pb: "env(safe-area-inset-bottom)", pt: 0.5 }}>
          {/* Microphone Toggle */}
          <Tooltip title={micEnabled ? "Mute microphone" : "Unmute microphone"}>
            <span>
              <IconButton
                disabled={!mediaReady}
                onClick={toggleMic}
                aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"}
                sx={{
                  bgcolor: micEnabled ? "#374151" : "#b91c1c",
                  color: "white",
                  "&:hover": { bgcolor: micEnabled ? "#4b5563" : "#991b1b" },
                }}
              >
                {micEnabled ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </span>
          </Tooltip>

          {/* Camera Toggle */}
          <Tooltip title={isScreenSharing ? "Stop screen sharing to toggle camera" : (cameraEnabled ? "Turn camera off" : "Turn camera on")}>
            <span>
              <IconButton
                disabled={!mediaReady || isScreenSharing}
                onClick={() => void toggleCamera()}
                aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"}
                sx={{
                  bgcolor: cameraEnabled ? "#374151" : "#b91c1c",
                  color: "white",
                  "&:hover": { bgcolor: cameraEnabled ? "#4b5563" : "#991b1b" },
                }}
              >
                {cameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
            </span>
          </Tooltip>

          {/* Screen Share Toggle */}
          <Tooltip title={isScreenSharing ? "Stop sharing screen" : "Share tab, window or screen"}>
            <span>
              <IconButton
                disabled={!mediaReady}
                onClick={toggleScreenShare}
                aria-label={isScreenSharing ? "Stop sharing screen" : "Share screen"}
                sx={{
                  bgcolor: isScreenSharing ? "#2563eb" : "#374151",
                  color: "white",
                  "&:hover": { bgcolor: isScreenSharing ? "#1d4ed8" : "#4b5563" },
                }}
              >
                {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            </span>
          </Tooltip>

          {/* Camera Switch (Mobile) */}
          {showCameraSwitch && !isScreenSharing && cameraEnabled && (
            <Tooltip title={cameraFacing === "user" ? "Switch to back camera" : "Switch to front camera"}>
              <span>
                <IconButton
                  disabled={!mediaReady || !localStreamRef.current?.getVideoTracks().length || switchingCamera}
                  onClick={() => void switchCamera()}
                  aria-label={cameraFacing === "user" ? "Switch to back camera" : "Switch to front camera"}
                  sx={{ bgcolor: "#374151", color: "white", "&:hover": { bgcolor: "#4b5563" } }}
                >
                  <CameraswitchIcon />
                </IconButton>
              </span>
            </Tooltip>
          )}

          {/* Speaker / Audio Output Switcher */}
          {audioOutputs.length > 0 && (
            <Tooltip title="Speaker / Audio Output">
              <span>
                <IconButton
                  onClick={(e) => setSpeakerMenuAnchor(e.currentTarget)}
                  aria-label="Speaker / Audio Output"
                  sx={{
                    bgcolor: "#374151",
                    color: "white",
                    "&:hover": { bgcolor: "#4b5563" },
                  }}
                >
                  {isLoudspeaker ? <VolumeUpIcon /> : <HeadsetIcon />}
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Menu
            anchorEl={speakerMenuAnchor}
            open={Boolean(speakerMenuAnchor)}
            onClose={() => setSpeakerMenuAnchor(null)}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
            transformOrigin={{ vertical: "bottom", horizontal: "center" }}
            slotProps={{
              paper: {
                sx: {
                  bgcolor: "#1E242B",
                  color: "#FFFFFF",
                  borderRadius: "14px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                  minWidth: 210,
                  mb: 1,
                },
              },
            }}
          >
            <Typography variant="caption" sx={{ px: 2, py: 1, display: "block", color: "rgba(255,255,255,0.6)", fontWeight: 600 }}>
              Audio Output Devices
            </Typography>
            {audioOutputs.map((device, idx) => (
              <MenuItem
                key={device.deviceId || idx}
                selected={device.deviceId === selectedAudioOutput}
                onClick={() => void handleSelectAudioOutput(device.deviceId)}
                sx={{
                  py: 1,
                  "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.12)" },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: "auto", mr: 1.5, color: "inherit" }}>
                  {/headset|earpiece|headphone|bluetooth/i.test(device.label) ? (
                    <HeadsetIcon fontSize="small" />
                  ) : (
                    <VolumeUpIcon fontSize="small" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={device.label || `Speaker / Device ${idx + 1}`}
                  primaryTypographyProps={{ fontSize: 13, fontWeight: device.deviceId === selectedAudioOutput ? 600 : 400 }}
                />
              </MenuItem>
            ))}
          </Menu>

          {/* Full Screen Toggle (Feature 1) */}
          <Tooltip title={isFullscreen ? "Exit full screen" : "Enter full screen"}>
            <span>
              <IconButton
                onClick={() => void toggleFullscreen()}
                aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
                sx={{
                  bgcolor: isFullscreen ? "#2563eb" : "#374151",
                  color: "white",
                  "&:hover": { bgcolor: isFullscreen ? "#1d4ed8" : "#4b5563" },
                }}
              >
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            </span>
          </Tooltip>

          {/* Leave Call */}
          <Button
            onClick={leaveMeeting}
            variant="contained"
            startIcon={<CallEndIcon />}
            sx={{
              bgcolor: "#D93025",
              color: "#FFFFFF",
              "&:hover": { bgcolor: "#B3261E" },
              borderRadius: "8px",
              px: 2,
              textTransform: "none",
              fontWeight: 600,
            }}
          >
            Leave
          </Button>

          {canRetryMedia && (
            <Button
              onClick={() => { setError(""); setRetryCount((count) => count + 1); }}
              variant="outlined"
              sx={{ color: "white", borderColor: "#9ca3af", borderRadius: "8px" }}
            >
              Retry
            </Button>
          )}
        </Stack>
      </Box>
    </Box>
  );
};

const LocalVideoTile = ({
  stream,
  cameraEnabled,
  mediaReady,
  cameraFacing,
  isScreenSharing,
  localProfile,
  localIsSpeaking,
  isPip = false,
}: {
  stream: MediaStream | null;
  cameraEnabled: boolean;
  mediaReady: boolean;
  cameraFacing: "user" | "environment";
  isScreenSharing: boolean;
  localProfile: { name: string; avatar: string | null };
  localIsSpeaking: boolean;
  isPip?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const showVideo = (cameraEnabled && mediaReady) || isScreenSharing;

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      if (showVideo) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [stream, showVideo]);

  return (
    <Paper
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        minHeight: isPip ? 0 : { xs: 0, md: 360 },
        overflow: "hidden",
        bgcolor: "#20242A",
        display: "grid",
        placeItems: "center",
        border: "1px solid rgba(255,255,255,.14)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          display: showVideo ? "block" : "none",
          width: "100%",
          height: "100%",
          objectFit: isScreenSharing ? "contain" : "cover",
          backgroundColor: "#111318",
          position: "absolute",
          inset: 0,
          transform: isScreenSharing ? "none" : (cameraFacing === "user" ? "scaleX(-1)" : "none"),
        }}
      />
      {mediaReady && !showVideo && (
        <ParticipantAvatar
          name={localProfile.name}
          avatar={localProfile.avatar}
          isSpeaking={localIsSpeaking}
          size={isPip ? "small" : "normal"}
        />
      )}
      {!mediaReady && (
        <Typography color="#C4C7C5" variant="caption" sx={{ px: 1, textAlign: "center" }}>
          Preview unavailable
        </Typography>
      )}
      <Typography
        variant={isPip ? "caption" : "body2"}
        fontWeight={500}
        sx={{
          position: "absolute",
          left: isPip ? 8 : { xs: 6, sm: 12 },
          bottom: isPip ? 6 : { xs: 4, sm: 8 },
          color: "#FFFFFF",
          textShadow: "0 1px 4px #000",
        }}
      >
        {isScreenSharing ? "You (Screen)" : "You"}
      </Typography>
    </Paper>
  );
};

const RemoteVideoTile = ({
  socketId,
  stream,
  name,
  avatar,
  cameraEnabled,
  micEnabled,
  isScreenSharing = false,
  isPip = false,
}: RemoteVideo & {
  name: string;
  avatar: string | null;
  cameraEnabled: boolean;
  micEnabled: boolean;
  isScreenSharing?: boolean;
  isPip?: boolean;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isSpeaking = useSpeakingActivity(stream, micEnabled, cameraEnabled);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const showVideo = cameraEnabled || isScreenSharing;

  return (
    <Paper
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        bgcolor: "#20242A",
        minHeight: isPip ? 0 : { xs: 0, md: 360 },
        display: "grid",
        placeItems: "center",
        border: "1px solid rgba(255,255,255,.1)",
      }}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: isScreenSharing ? "contain" : "cover",
          backgroundColor: "#111318",
          position: "absolute",
          inset: 0,
          visibility: showVideo ? "visible" : "hidden",
        }}
      />
      {!showVideo && (
        <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "#191C20" }}>
          <ParticipantAvatar name={name} avatar={avatar} isSpeaking={isSpeaking} size={isPip ? "small" : "normal"} />
        </Box>
      )}
      <Typography
        variant={isPip ? "caption" : "body2"}
        fontWeight={500}
        sx={{
          position: "absolute",
          left: isPip ? 8 : 16,
          bottom: isPip ? 6 : 12,
          color: "#FFFFFF",
          textShadow: "0 1px 4px #000",
          maxWidth: "70%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {isScreenSharing ? `${name}'s screen` : name}
      </Typography>
      {!micEnabled && (
        <Box
          sx={{
            position: "absolute",
            right: isPip ? 6 : 12,
            bottom: isPip ? 6 : 9,
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            px: isPip ? 0.75 : 1,
            py: isPip ? 0.25 : 0.5,
            borderRadius: "10px",
            bgcolor: "rgba(0,0,0,.68)",
            color: "#fff",
          }}
        >
          <MicOffIcon sx={{ fontSize: isPip ? 13 : 16 }} />
          {!isPip && <Typography variant="caption" fontWeight={600}>Muted</Typography>}
        </Box>
      )}
      <span hidden>{socketId}</span>
    </Paper>
  );
};

const ParticipantAvatar = ({
  name,
  avatar,
  isSpeaking,
  size = "normal",
}: {
  name: string;
  avatar: string | null;
  isSpeaking: boolean;
  size?: "small" | "normal";
}) => {
  const [linger, setLinger] = useState(false);

  useEffect(() => {
    if (!isSpeaking) {
      if (!linger) return;
      const timeout = window.setTimeout(() => setLinger(false), 600);
      return () => window.clearTimeout(timeout);
    }
    const timeout = window.setTimeout(() => setLinger(true), 0);
    return () => window.clearTimeout(timeout);
  }, [isSpeaking, linger]);

  const showWave = isSpeaking || linger;

  const waveStyle = {
    content: '""',
    position: "absolute",
    inset: -6,
    border: "2px solid #A8C7FA",
    borderRadius: "50%",
    animation: isSpeaking ? "speaking-wave 0.6s ease-out infinite" : "speaking-wave 0.6s ease-out 1",
    animationFillMode: "forwards",
    pointerEvents: "none",
  } as const;

  const isSmall = size === "small";

  return (
    <Box
      sx={{
        width: isSmall ? 48 : { xs: 76, md: 112 },
        height: isSmall ? 48 : { xs: 76, md: 112 },
        borderRadius: "50%",
        display: "grid",
        placeItems: "center",
        position: "relative",
        "@keyframes speaking-wave": {
          "0%": { transform: "scale(0.9)", opacity: 0.75 },
          "100%": { transform: "scale(1.65)", opacity: 0 },
        },
        ...(showWave && {
          "&::before, &::after": waveStyle,
          "&::after": { ...waveStyle, animationDelay: isSpeaking ? "300ms" : "0ms" },
        }),
      }}
    >
      <Avatar
        src={
          avatar
            ? avatar.startsWith("http")
              ? avatar
              : `${import.meta.env.VITE_BACKEND_URL}${avatar}`
            : undefined
        }
        alt={name}
        sx={{
          width: "100%",
          height: "100%",
          fontSize: isSmall ? 18 : { xs: 30, md: 44 },
          bgcolor: "#39434E",
          color: "#E3E3E3",
          position: "relative",
          zIndex: 1,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Avatar>
    </Box>
  );
};

export default MeetingPage;
