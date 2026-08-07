import { useState } from "react";
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Collapse,
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
import { CircularProgress } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import GroupIcon from "@mui/icons-material/Group";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import ForumIcon from "@mui/icons-material/Forum";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { type Community } from "../../../types/community";
import { type JoinRequest } from "../../posts/types";
import { useEffect } from "react";
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
    >("overview");
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
            }}
        >
            {/* Back */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={onBack}
                sx={{ mb: 3 }}
            >
                Back to Chat
            </Button>

            {/* Header */}
            <Paper
                elevation={4}
                sx={{
                    p: 4,
                    borderRadius: 4,
                    mb: 4,
                }}
            >
                <Stack
                    direction={{
                        xs: "column",
                        md: "row",
                    }}
                    spacing={3}
                >
                    <Avatar
                        src={community.avatar ?? undefined}
                        sx={{
                            width: 110,
                            height: 110,
                            fontSize: 42,
                        }}
                    >
                        {community.name[0]}
                    </Avatar>

                    <Box flex={1}>
                        <Typography
                            variant="h4"
                            fontWeight={700}
                        >
                            {community.name}
                        </Typography>

                        <Typography
                            color="text.secondary"
                            mb={2}
                        >
                            @{community.slug}
                        </Typography>

                        <Chip
                            icon={
                                community.isPrivate ? (
                                    <LockIcon />
                                ) : (
                                    <PublicIcon />
                                )
                            }
                            color={
                                community.isPrivate
                                    ? "warning"
                                    : "success"
                            }
                            label={
                                community.isPrivate
                                    ? "Private"
                                    : "Public"
                            }
                        />

                        <Typography
                            mt={3}
                            color="text.secondary"
                        >
                            {community.description}
                        </Typography>

                        <Divider sx={{ my: 2 }} />

                        <Typography>
                            <b>Rules</b>
                        </Typography>

                        <Typography color="text.secondary">
                            {community.rules}
                        </Typography>
                    </Box>
                </Stack>
            </Paper>

            {/* Dashboard Cards */}
            <Box
                sx={{
                    flex: 1,
                    overflowY: "auto",
                    minHeight: 0,
                    pr: 1,
                }}
            >
                <Grid
                    container
                    spacing={3}
                    mb={4}
                >
                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card
                            onClick={() =>
                                setActiveSection((prev) =>
                                    prev === "members" ? "overview" : "members"
                                )
                            }
                            sx={{
                                cursor: "pointer",
                                transition: ".25s",
                                "&:hover": {
                                    transform: "translateY(-5px)",
                                    boxShadow: 8,
                                },
                            }}
                        >
                            <CardContent>
                                <GroupIcon
                                    color="primary"
                                    fontSize="large"
                                />

                                <Typography
                                    variant="h6"
                                    mt={2}
                                >
                                    Members
                                </Typography>

                                <Typography color="text.secondary">
                                    Manage members
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card onClick={() =>
                            setActiveSection((prev) =>
                                prev === "requests" ? "overview" : "requests"
                            )
                        }
                            sx={{
                                cursor: "pointer",
                                transition: ".25s",
                                "&:hover": {
                                    transform: "translateY(-5px)",
                                    boxShadow: 8,
                                },
                            }}
                        >
                            <CardContent>
                                <Stack
                                    direction="row"
                                    justifyContent="space-between"
                                >
                                    <GroupAddIcon
                                        color="primary"
                                        fontSize="large"
                                    />
                                    {activeSection === "members" ? (
                                        <ExpandLessIcon />
                                    ) : (
                                        <ExpandMoreIcon />
                                    )}

                                    {activeSection === "requests" ? (
                                        <ExpandLessIcon />
                                    ) : (
                                        <ExpandMoreIcon />
                                    )}
                                </Stack>

                                <Typography
                                    variant="h6"
                                    mt={2}
                                >
                                    Join Requests
                                </Typography>

                                <Typography color="text.secondary">
                                    {requests.length} Pending
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card>
                            <CardContent>
                                <ForumIcon
                                    color="primary"
                                    fontSize="large"
                                />

                                <Typography
                                    variant="h6"
                                    mt={2}
                                >
                                    Posts
                                </Typography>

                                <Typography color="text.secondary">
                                    Community posts
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 3 }}>
                        <Card>
                            <CardContent>
                                <SettingsIcon
                                    color="primary"
                                    fontSize="large"
                                />

                                <Typography
                                    variant="h6"
                                    mt={2}
                                >
                                    Settings
                                </Typography>

                                <Typography color="text.secondary">
                                    Community settings
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Join Requests */}
                <Collapse in={activeSection === "members"}>
                    <CommunityMembers communityId={community.id} />
                </Collapse>

                <Collapse in={activeSection === "requests"}>
                    <Paper
                        elevation={3}
                        sx={{
                            p: 3,
                            borderRadius: 4,
                        }}
                    >
                        <Typography
                            variant="h5"
                            gutterBottom
                        >
                            Pending Join Requests
                        </Typography>

                        <Divider sx={{ mb: 2 }} />

                        {loadingRequests ? (
                            <Box display="flex" justifyContent="center" py={4}>
                                <CircularProgress />
                            </Box>
                        ) : requests.length === 0 ? (
                            <Typography
                                color="text.secondary"
                            >
                                No pending requests.
                            </Typography>
                        ) : (
                            <List>
                                {(role == "owner" || role == "moderator") && requests.map((request) => (
                                    <ListItem
                                        key={request.id}
                                        divider
                                        secondaryAction={
                                            <Stack
                                                direction="row"
                                                spacing={1}
                                            >
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    onClick={() => handleAccept(request.id)}
                                                >
                                                    Accept
                                                </Button>

                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    onClick={() => handleReject(request.id)}
                                                >
                                                    Reject
                                                </Button>
                                            </Stack>
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar
                                                src={
                                                    request.avatar ??
                                                    undefined
                                                }
                                            >
                                                {request.name[0]}
                                            </Avatar>
                                        </ListItemAvatar>

                                        <ListItemText
                                            primary={request.name}
                                            secondary={
                                                <>
                                                    {request.email}
                                                    <br />
                                                    Requested on{" "}
                                                    {new Date(request.createdAt).toLocaleDateString()}
                                                </>
                                            }
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Collapse>
            </Box>
        </Box>
    );
};

export default CommunityDashboard;