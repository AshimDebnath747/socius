import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  AppBar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CameraswitchIcon from "@mui/icons-material/Cameraswitch";
import CallEndIcon from "@mui/icons-material/CallEnd";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { socket } from "../../socket";
import api from "../../lib/axios";

type PeerPayload = { socketId: string; userId: string | number };
type SignalOffer = { offer: RTCSessionDescriptionInit; callerSocketId: string };
type SignalAnswer = { answer: RTCSessionDescriptionInit; responderSocketId: string };
type SignalCandidate = { candidate: RTCIceCandidateInit; senderSocketId: string };
type RemoteVideo = { socketId: string; stream: MediaStream };

const describeMediaError = (error: unknown) => {
  if (!window.isSecureContext) {
    return "Your phone is opening this page over an insecure HTTP address. Camera and microphone require HTTPS on mobile. Open the app through an HTTPS URL, such as your Cloudflare tunnel, then retry.";
  }
  if (!navigator.mediaDevices?.getUserMedia) {
    return "This browser does not provide camera and microphone access. Open the app in a supported browser over HTTPS, then retry.";
  }
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return "Camera or microphone access is blocked. Allow both in this site’s browser permissions, then retry.";
  }
  if (name === "NotFoundError") {
    return "No camera or microphone was found. Connect a device and retry.";
  }
  if (name === "NotReadableError" || name === "AbortError") {
    return "The camera or microphone is busy in another app. Close the other app and retry.";
  }
  if (name === "OverconstrainedError") {
    return "The selected camera or microphone is unavailable. Check your connected devices and retry.";
  }
  return "Could not open your camera and microphone. Check browser permissions and connected devices, then retry.";
};

const rtcConfiguration: RTCConfiguration = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const isMobileDevice = () =>
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const MeetingPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const showCameraSwitch = isMobileDevice();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnections = useRef(new Map<string, RTCPeerConnection>());
  const pendingIceCandidates = useRef(new Map<string, RTCIceCandidateInit[]>());
  const [remoteVideos, setRemoteVideos] = useState<RemoteVideo[]>([]);
  const [status, setStatus] = useState("Joining meeting…");
  const [error, setError] = useState("");
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [mediaReady, setMediaReady] = useState(false);
  const [canRetryMedia, setCanRetryMedia] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [cameraFacing, setCameraFacing] = useState<"user" | "environment">("user");
  const [switchingCamera, setSwitchingCamera] = useState(false);

  const createPeerConnection = useCallback((remoteSocketId: string) => {
    const existing = peerConnections.current.get(remoteSocketId);
    if (existing) return existing;

    const peer = new RTCPeerConnection(rtcConfiguration);
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) socket.emit("ice-candidate", { targetSocketId: remoteSocketId, candidate });
    };
    peer.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (!stream) return;
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
    localStreamRef.current?.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current!));
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
    };
    const handleNewUser = ({ socketId }: PeerPayload) => {
      void startOffer(socketId).catch((cause: unknown) => {
        console.error("Could not start peer connection:", cause);
        setError("Could not connect to the other participant.");
      });
    };
    const handleUsersAlreadyThere = (users: PeerPayload[]) => {
      setStatus(users.length ? "Connecting to the other participant…" : "You’re in the meeting. Waiting for the other participant…");
    };
    const handleUserLeft = ({ socketId }: { socketId: string }) => removePeer(socketId);

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

    socket.on("new-user-joined", handleNewUser);
    socket.on("users-already-in-meeting", handleUsersAlreadyThere);
    socket.on("user-left-meeting", handleUserLeft);
    socket.on("webrtc-offer", handleOffer);
    socket.on("webrtc-answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("meeting-error", handleMeetingError);

    const joinMeeting = async () => {
      let sessionValidated = false;
      try {
        const sessionResponse = await api.get(`/api/sessions/${roomId}`);
        sessionValidated = true;
        if (sessionResponse.data?.data?.status !== "active") {
          setError("This session has ended and its meeting is closed.");
          setStatus("Meeting unavailable");
          return;
        }
        if (!window.isSecureContext) {
          throw new Error("Camera and microphone require a secure page.");
        }
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Media capture is unavailable in this browser.");
        }
        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: { ideal: "user" } },
          });
          setCameraEnabled(true);
          setCameraFacing("user");
        } catch (mediaError) {
          const mediaErrorName = mediaError instanceof DOMException ? mediaError.name : "";
          if (!["NotFoundError", "NotReadableError", "OverconstrainedError"].includes(mediaErrorName)) {
            throw mediaError;
          }
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setCameraEnabled(false);
          setStatus("Camera unavailable; joining with microphone only.");
        }
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        setMediaReady(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        socket.emit("join-meeting", roomId, (result: { success: boolean; message?: string }) => {
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

    if (socket.connected) void joinMeeting();
    else socket.once("connect", joinMeeting);

    return () => {
      cancelled = true;
      socket.off("connect", joinMeeting);
      socket.off("new-user-joined", handleNewUser);
      socket.off("users-already-in-meeting", handleUsersAlreadyThere);
      socket.off("user-left-meeting", handleUserLeft);
      socket.off("webrtc-offer", handleOffer);
      socket.off("webrtc-answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("meeting-error", handleMeetingError);
      socket.emit("leave-meeting");
      peerConnections.current.forEach((peer) => peer.close());
      peerConnections.current.clear();
      pendingIceCandidates.current.clear();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setMediaReady(false);
    };
  }, [roomId, createPeerConnection, startOffer, retryCount]);

  const toggleMic = () => {
    const next = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = next; });
    setMicEnabled(next);
  };
  const toggleCamera = () => {
    const next = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = next; });
    setCameraEnabled(next);
  };
  const switchCamera = async () => {
    const currentStream = localStreamRef.current;
    if (!currentStream || switchingCamera) return;

    const nextFacing = cameraFacing === "user" ? "environment" : "user";
    const currentTrack = currentStream.getVideoTracks()[0];
    if (!currentTrack) return;

    const replaceOutgoingVideo = async (track: MediaStreamTrack) => {
      const videoSenders = Array.from(peerConnections.current.values())
        .flatMap((peer) => peer.getSenders())
        .filter((sender) => sender.track?.kind === "video");
      await Promise.all(videoSenders.map((sender) => sender.replaceTrack(track)));
    };
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
        // Some phones cannot open both cameras at once. Release the current
        // track and retry the selected device after it becomes available.
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
              if (localVideoRef.current) localVideoRef.current.srcObject = nextStream;
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
      if (localVideoRef.current) localVideoRef.current.srcObject = nextStream;
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
    socket.emit("leave-meeting");
    navigate("/chat");
  };

  return (
    <Box sx={{ minHeight: "calc(100vh - 64px)", display: "flex", flexDirection: "column", bgcolor: "#111827", color: "white" }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <IconButton color="inherit" onClick={leaveMeeting} aria-label="Back to chat"><ArrowBackIcon /></IconButton>
          <Typography variant="h6" sx={{ flex: 1 }}>Help session meeting</Typography>
          <Typography variant="body2" color="inherit">Session {roomId}</Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 3 }, display: "flex", flexDirection: "column", gap: 2 }}>
        {error && <Alert severity="error" onClose={() => setError("")}>{error}</Alert>}
        <Typography textAlign="center" color="#d1d5db">{status}</Typography>
        <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" }, gap: 2, alignContent: "center" }}>
          <Paper sx={{ position: "relative", overflow: "hidden", bgcolor: "#263244", minHeight: { xs: 230, md: 360 }, display: "grid", placeItems: "center" }}>
            <video ref={localVideoRef} autoPlay muted playsInline style={{ display: cameraEnabled && mediaReady ? "block" : "none", width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0, transform: cameraFacing === "user" ? "scaleX(-1)" : "none" }} />
            {(!mediaReady || !cameraEnabled) && <Typography color="#d1d5db">{mediaReady ? "Camera is off" : "Camera preview unavailable"}</Typography>}
            <Typography sx={{ position: "absolute", left: 16, bottom: 12, textShadow: "0 1px 4px #000" }}>You</Typography>
          </Paper>
          {remoteVideos.length ? remoteVideos.map(({ socketId, stream }) => (
            <RemoteVideoTile key={socketId} socketId={socketId} stream={stream} />
          )) : (
            <Paper sx={{ bgcolor: "#263244", minHeight: { xs: 230, md: 360 }, display: "grid", placeItems: "center", color: "#d1d5db" }}>
              <Stack alignItems="center" spacing={1}><CircularProgress size={26} sx={{ color: "#d1d5db" }} /><Typography>Waiting for the other participant</Typography></Stack>
            </Paper>
          )}
        </Box>
        <Stack direction="row" justifyContent="center" spacing={2} sx={{ pb: 1 }}>
          <Tooltip title={micEnabled ? "Mute microphone" : "Unmute microphone"}>
            <span><IconButton disabled={!mediaReady} onClick={toggleMic} aria-label={micEnabled ? "Mute microphone" : "Unmute microphone"} sx={{ bgcolor: micEnabled ? "#374151" : "#b91c1c", color: "white", "&:hover": { bgcolor: micEnabled ? "#4b5563" : "#991b1b" } }}>
              {micEnabled ? <MicIcon /> : <MicOffIcon />}
            </IconButton></span>
          </Tooltip>
          <Tooltip title={cameraEnabled ? "Turn camera off" : "Turn camera on"}>
            <span><IconButton disabled={!mediaReady || !localStreamRef.current?.getVideoTracks().length} onClick={toggleCamera} aria-label={cameraEnabled ? "Turn camera off" : "Turn camera on"} sx={{ bgcolor: cameraEnabled ? "#374151" : "#b91c1c", color: "white", "&:hover": { bgcolor: cameraEnabled ? "#4b5563" : "#991b1b" } }}>
              {cameraEnabled ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton></span>
          </Tooltip>
          {showCameraSwitch && (
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
          <Button onClick={leaveMeeting} variant="contained" color="error" startIcon={<CallEndIcon />}>Leave</Button>
          {canRetryMedia && <Button onClick={() => { setError(""); setRetryCount((count) => count + 1); }} variant="outlined" sx={{ color: "white", borderColor: "#9ca3af" }}>Retry</Button>}
        </Stack>
      </Box>
    </Box>
  );
};

const RemoteVideoTile = ({ socketId, stream }: RemoteVideo) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return (
    <Paper sx={{ position: "relative", overflow: "hidden", bgcolor: "#263244", minHeight: { xs: 230, md: 360 }, display: "grid", placeItems: "center" }}>
      <video ref={videoRef} autoPlay playsInline style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
      <Typography sx={{ position: "absolute", left: 16, bottom: 12, textShadow: "0 1px 4px #000" }}>Participant</Typography>
      <span hidden>{socketId}</span>
    </Paper>
  );
};

export default MeetingPage;
