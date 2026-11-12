import { useState, useEffect } from "react";
import {
    Avatar,
    Box,
    Button,
    Chip,
    CircularProgress,
    Divider,
    Grid,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Stack,
    Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import GroupIcon from "@mui/icons-material/Group";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import SettingsIcon from "@mui/icons-material/Settings";

import { type Community } from "../../../types/community";
import { type JoinRequest } from "../../posts/types";
import axios from "axios";
import CommunityMembers from "./communityMembersDashboard";
interface Props {
    community: Community;
    onBack: () => void;
}
const API = import.meta.env.VITE_BACKEND_URL
const CommunityDashboard = ({
    community,
    onBack,
}: Props) => {
    const [requests, setRequests] = useState<JoinRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(false);
    const [activeSection, setActiveSection] = useState<
        "overview" | "requests" | "members" | "posts" | "settings"
    >("members");
    const [role, setRole] = useState<string>("member");
    useEffect(() => {
        const fetchRole = async () => {
            const res = await axios.get(
                `${API}/api/communities/${community.id}/my-membership`,
                { withCredentials: true }
            );

            setRole(res.data.data.role);
        };

        fetchRole();
    }, [community.id]);
    useEffect(() => {
        if (!community) return;

        fetchJoinRequests();
    }, [community.id]);
    const fetchJoinRequests = async () => {
        try {
            setLoadingRequests(true);

            const response = await axios.get(
                `${API}/api/communities/${community.id}/join-requests`,
                {
                    withCredentials: true,
                }
            );
            console.log(response.data.success)
            if (!response.data.success) {
                setRequests([])
                return
            }
            const mappedRequests: JoinRequest[] = response.data.data.map(
                ({
                    community_id,
                    user_id,
                    created_at,
                    ...rest
                }: any) => ({
                    ...rest,
                    communityId: community_id,
                    userId: user_id,
                    createdAt: created_at,
                })
            );


            setRequests(mappedRequests);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingRequests(false);
        }
    }; const handleAccept = async (requestId: number) => {
        try {
            await axios.post(
                `${API}/api/communities/${community.id}/join-requests/${requestId}/accept`,
                {},
                {
                    withCredentials: true,
                }
            );

            setRequests((prev) =>
                prev.filter((r) => r.id !== requestId)
            );
        } catch (err) {
            console.error(err);
        }
    }; const handleReject = async (requestId: number) => {
        try {
            await axios.post(
                `${API}/api/communities/${community.id}/join-requests/${requestId}/reject`,
                {},
                {
                    withCredentials: true,
                }
            );

            setRequests((prev) =>
                prev.filter((r) => r.id !== requestId)
            );
        } catch (err) {
            console.error(err);
        }
    };
    return (
        <Box
            sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                p: { xs: 1, sm: 1.5, md: 2 },
            }}
        >
            {/* Main 2-Column Split: Left (Back Button + Info + Buttons) & Right (Member List) */}
            <Grid
                container
                spacing={2}
                sx={{
                    height: "100%",
                    minHeight: 0,
                }}
            >
                {/* Left Column: Back button + Info card on top, Buttons on bottom */}
                <Grid
                    size={{ xs: 12, md: 5 }}
                    sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 1.5,
                        height: "100%",
                        minHeight: 0,
                        overflowY: "auto",
                        pr: { md: 0.5 },
                    }}
                >
                    {/* Back to Chat Button */}
                    <Box sx={{ display: "flex", alignItems: "center", mb: -0.5 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={onBack}
                            variant="text"
                            size="small"
                            sx={{
                                textTransform: "none",
                                fontWeight: 600,
                                color: "text.primary",
                                py: 0.5,
                                px: 1,
                                borderRadius: "8px",
                            }}
                        >
                            Back to Chat
                        </Button>
                    </Box>

                    {/* Top Card: Icon, Name, Slug, Badge, Description, Rules */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 3,
                            borderRadius: "14px",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                        }}
                    >
                        <Stack direction="row" spacing={2.5} alignItems="flex-start">
                            <Avatar
                                src={community.avatar ?? undefined}
                                sx={{
                                    width: 72,
                                    height: 72,
                                    fontSize: 32,
                                    fontWeight: 700,
                                    bgcolor: "primary.main",
                                    flexShrink: 0,
                                }}
                            >
                                {community.name[0]}
                            </Avatar>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="h5" fontWeight={700} noWrap>
                                    {community.name}
                                </Typography>

                                <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }} noWrap>
                                    @{community.slug}
                                </Typography>

                                <Chip
                                    icon={community.isPrivate ? <LockIcon sx={{ fontSize: "13px !important" }} /> : <PublicIcon sx={{ fontSize: "13px !important" }} />}
                                    color={community.isPrivate ? "warning" : "success"}
                                    size="small"
                                    variant="outlined"
                                    label={community.isPrivate ? "Private" : "Public"}
                                    sx={{ height: 22, fontSize: 11, fontWeight: 600 }}
                                />
                            </Box>
                        </Stack>

                        <Divider sx={{ my: 2.5 }} />

                        {/* Description */}
                        <Box>
                            <Typography
                                variant="caption"
                                sx={{
                                    textTransform: "uppercase",
                                    fontWeight: 700,
                                    letterSpacing: "0.06em",
                                    color: "text.secondary",
                                    display: "block",
                                    mb: 0.75,
                                }}
                            >
                                Description
                            </Typography>

                            <Typography
                                variant="body2"
                                sx={{
                                    color: community.description ? "text.primary" : "text.secondary",
                                    lineHeight: 1.6,
                                    fontSize: 14,
                                    fontStyle: community.description ? "normal" : "italic",
                                    whiteSpace: "pre-wrap",
                                }}
                            >
                                {community.description || "No description provided."}
                            </Typography>
                        </Box>

                        {/* Rules (if set) */}
                        {community.rules?.trim() ? (
                            <Box sx={{ mt: 2.5, pt: 2, borderTop: "1px dashed", borderColor: "divider" }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        textTransform: "uppercase",
                                        fontWeight: 700,
                                        letterSpacing: "0.06em",
                                        color: "text.secondary",
                                        display: "block",
                                        mb: 0.75,
                                    }}
                                >
                                    Rules
                                </Typography>

                                <Box
                                    sx={{
                                        bgcolor: "action.hover",
                                        p: 1.5,
                                        borderRadius: "8px",
                                        border: "1px solid",
                                        borderColor: "divider",
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            color: "text.secondary",
                                            whiteSpace: "pre-line",
                                            lineHeight: 1.6,
                                            fontSize: 13,
                                        }}
                                    >
                                        {community.rules}
                                    </Typography>
                                </Box>
                            </Box>
                        ) : null}
                    </Paper>

                    {/* Bottom Card: Buttons (Members, Join Requests, Settings) */}
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1,
                            borderRadius: "14px",
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "background.paper",
                        }}
                    >
                        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
                            <Button
                                fullWidth
                                variant={activeSection === "members" ? "contained" : "text"}
                                startIcon={<GroupIcon />}
                                onClick={() => setActiveSection("members")}
                                size="small"
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    py: 1,
                                    borderRadius: "10px",
                                }}
                            >
                                Members
                            </Button>

                            <Button
                                fullWidth
                                variant={activeSection === "requests" ? "contained" : "text"}
                                startIcon={<GroupAddIcon />}
                                onClick={() => setActiveSection("requests")}
                                size="small"
                                color={requests.length > 0 ? "warning" : "primary"}
                                sx={{
                                    textTransform: "none",
                                    fontWeight: 600,
                                    fontSize: 13,
                                    py: 1,
                                    borderRadius: "10px",
                                }}
                            >
                                Requests {requests.length > 0 ? `(${requests.length})` : ""}
                            </Button>

                            {(role === "owner" || role === "moderator") && (
                                <Button
                                    fullWidth
                                    variant={activeSection === "settings" ? "contained" : "text"}
                                    startIcon={<SettingsIcon />}
                                    onClick={() => setActiveSection("settings")}
                                    size="small"
                                    sx={{
                                        textTransform: "none",
                                        fontWeight: 600,
                                        fontSize: 13,
                                        py: 1,
                                        borderRadius: "10px",
                                    }}
                                >
                                    Settings
                                </Button>
                            )}
                        </Stack>
                    </Paper>
                </Grid>

                {/* Right Column: Member List (or active pane based on bottom buttons) */}
                <Grid
                    size={{ xs: 12, md: 7 }}
                    sx={{
                        height: "100%",
                        minHeight: 0,
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden",
                    }}
                >
                    {activeSection === "members" && (
                        <Box sx={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
                            <CommunityMembers communityId={community.id} />
                        </Box>
                    )}

                    {activeSection === "requests" && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: "14px",
                                border: "1px solid",
                                borderColor: "divider",
                                height: "100%",
                                overflowY: "auto",
                                bgcolor: "background.paper",
                            }}
                        >
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                Pending Join Requests
                            </Typography>

                            <Divider sx={{ mb: 2 }} />

                            {loadingRequests ? (
                                <Box display="flex" justifyContent="center" py={4}>
                                    <CircularProgress />
                                </Box>
                            ) : requests.length === 0 ? (
                                <Typography color="text.secondary">
                                    No pending requests.
                                </Typography>
                            ) : (
                                <List>
                                    {(role === "owner" || role === "moderator") && requests.map((request) => (
                                        <ListItem
                                            key={request.id}
                                            divider
                                            secondaryAction={
                                                <Stack direction="row" spacing={1}>
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        size="small"
                                                        onClick={() => handleAccept(request.id)}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        variant="outlined"
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleReject(request.id)}
                                                    >
                                                        Reject
                                                    </Button>
                                                </Stack>
                                            }
                                        >
                                            <ListItemAvatar>
                                                <Avatar src={request.avatar ?? undefined}>
                                                    {request.name[0]}
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={request.name}
                                                secondary={
                                                    <>
                                                        {request.email}
                                                        <br />
                                                        Requested on {new Date(request.createdAt).toLocaleDateString()}
                                                    </>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Paper>
                    )}

                    {activeSection === "settings" && (
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                borderRadius: "14px",
                                border: "1px solid",
                                borderColor: "divider",
                                height: "100%",
                                overflowY: "auto",
                                bgcolor: "background.paper",
                            }}
                        >
                            <Typography variant="h5" fontWeight={700} gutterBottom>
                                Community Settings
                            </Typography>
                            <Divider sx={{ mb: 2 }} />
                            <Typography color="text.secondary" variant="body2">
                                Manage community privacy, slug, and permissions.
                            </Typography>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default CommunityDashboard;