import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Box,
    Chip,
    CircularProgress,
    Divider,
    Paper,
    Button,
    Typography,
} from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import CheckIcon from "@mui/icons-material/Check";
import GroupAddIcon from "@mui/icons-material/Group";
import CommunityMembersCard from "../components/communityMemberCard";
import axios from 'axios';
import { type Community } from "../../../types/community";
import { type CommunityMember } from "../../posts/types";
const API = import.meta.env.VITE_BACKEND_URL

const user: string | null = localStorage.getItem("user")
let CURRENT_USER_ID: string = ""
if (user) CURRENT_USER_ID = String(JSON.parse(user).id);

const CommunityInfo = () => {
    const { slug } = useParams<{ slug: string }>();

    const [community, setCommunity] = useState<Community | null>(null);
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [loadingCommunity, setLoadingCommunity] = useState(true);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [joined, setJoined] = useState(false)
    const [requested, setRequested] = useState(false)
    useEffect(() => {
        const checkRequestStatus = async () => {
            try {
                if (community !== null) {

                    const res = await axios.get(`${API}/api/communities/${community.id}/join-request/status`, { withCredentials: true })
                    console.log("request status", res.data.data)
                    if (res.data.data.status === 'pending') {
                        setRequested(true)
                    }
                } else {
                    console.log("no community found!")
                }
            } catch (err) {
                console.log("can not fetch request status", err)
            }
        }
        checkRequestStatus()
    }, [community])
    useEffect(() => {
        const fetchCommunity = async () => {
            try {
                const response = await axios.get(`${API}/api/communities/${slug}`, { withCredentials: true });
                console.log(response.data.data)
                const {
                    id,
                    is_private,
                    created_at,
                    ...rest
                } = response.data.data;

                const mappedCommunity: Community = {
                    ...rest,
                    id: String(id),
                    isPrivate: is_private,
                    createdAt: created_at,
                };

                setCommunity(mappedCommunity);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingCommunity(false);
            }
        };

        fetchCommunity();
    }, [slug]);

    useEffect(() => {
        if (!community) return;

        const fetchMembers = async () => {
            try {
                const response = await axios.get(
                    `${API}/api/communities/${community.id}/members`
                    , { withCredentials: true });
                console.log(response.data.data)
                const mappedMembers: CommunityMember[] = response.data.data.map(
                    ({ id, joined_at, ...rest }: any) => ({
                        ...rest,
                        id: String(id),
                        joinedAt: new Date(joined_at),
                    })
                );

                setMembers(mappedMembers);
                console.log("current user id:", CURRENT_USER_ID)
                setJoined(
                    mappedMembers.some(member => member.id === CURRENT_USER_ID))
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingMembers(false);
            }
        };

        fetchMembers();
    }, [community]);
    const handleRequest = async () => {
        if (community === null) {
            return
        }
        else {
            try {
                const res = await axios.post(`${API}/api/communities/${community?.id}/join-request`, {},
                    { withCredentials: true })
                console.log(res)
                setRequested(true)
            } catch (err) {
                console.log("error occured", err)
                setRequested(false)
            }

        }
    }
    const handleJoin = async () => {
        try {
            const communityId = community ? community.id : null;
            if (communityId == null) {
                setJoined(false)
            }
            const response = await axios.post(
                `${API}/api/communities/${communityId}/join`, {}
                , { withCredentials: true });
            console.log(response)
            setJoined(true)
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingMembers(false);
        }
    }
    if (loadingCommunity) {
        return (
            <Box
                display="flex"
                justifyContent="center"
                mt={10}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (!community) {
        return (
            <Typography align="center" mt={8}>
                Community not found.
            </Typography>
        );
    }

    return (
        <Box
            maxWidth="900px"
            mx="auto"
            p={4}
        >
            {/* Community Information */}
            <Paper
                elevation={3}
                sx={{
                    p: 4,
                    borderRadius: 3,
                    mb: 4,
                }}
            >
                <Typography
                    variant="h3"
                    fontWeight={700}
                    gutterBottom
                >
                    {community.name}
                </Typography>

                <Chip
                    sx={{ mb: 3 }}
                    color={community.isPrivate ? "warning" : "success"}
                    icon={
                        community.isPrivate ? (
                            <LockIcon />
                        ) : (
                            <PublicIcon />
                        )
                    }
                    label={
                        community.isPrivate
                            ? "Private Community"
                            : "Public Community"
                    }
                />
                {community.isPrivate && !joined ? <Button
                    variant={requested ? "outlined" : "contained"}
                    color={requested ? "success" : "primary"}
                    startIcon={requested ? <CheckIcon /> : <GroupAddIcon />}
                    onClick={handleRequest}
                    sx={{
                        ml: 50,
                        textTransform: "none",
                        borderRadius: 2,
                        minWidth: 170,
                    }}
                >
                    {requested ? "request sent" : "send join Request"}
                </Button> : <Button

                    variant={joined ? "outlined" : "contained"}
                    color={joined ? "success" : "primary"}
                    startIcon={joined ? <CheckIcon /> : <GroupAddIcon />}
                    onClick={handleJoin}
                    sx={{
                        ml: 50,
                        textTransform: "none",
                        borderRadius: 2,
                        minWidth: 170,
                    }}
                >
                    {joined ? "Joined" : "Join Community"}
                </Button>}
                <Divider sx={{ mb: 3 }} />

                <Typography
                    variant="h6"
                    gutterBottom
                >
                    Description
                </Typography>

                <Typography
                    color="text.secondary"
                    paragraph
                >
                    {community.description}
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography
                    variant="h6"
                    gutterBottom
                >
                    Rules
                </Typography>

                <Typography
                    color="text.secondary"
                    whiteSpace="pre-line"
                >
                    {community.rules}
                </Typography>

                <Divider sx={{ my: 3 }} />

                <Typography color="text.secondary">
                    Created on{" "}
                    {new Date(community.createdAt).toLocaleDateString()}
                </Typography>
            </Paper>

            {/* Members */}
            <CommunityMembersCard
                members={members}
                loading={loadingMembers}
            />
        </Box >
    );
};

export default CommunityInfo;