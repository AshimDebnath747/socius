import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
    Box,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Divider,
    Typography,
    Button,
    FormControl,
    InputLabel,
    MenuItem,
    Select
} from "@mui/material";
import api from "../../../lib/axios";
import type { Post } from "../types";
import { useNavigate } from "react-router-dom";
const PostPage = () => {
    const { id } = useParams();

    const [request, setRequest] = useState<Post | null>(null);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState<"call" | "chat">("call");

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const res = await api.get(`api/help-requests/${id}`);
                console.log(res.data.data)
                const post: Post = {
                    id: res.data.data.id,
                    title: res.data.data.title,
                    description: res.data.data.description,
                    categoryId: res.data.data.category_id,
                    communityId: res.data.data.community_id,
                    preferredMode: res.data.data.preferred_mode,
                    status: res.data.data.req_status,
                    urgency: res.data.data.urgency,
                    createdAt: res.data.data.created_at,
                    createdBy: res.data.data.created_by,
                    name: res.data.data.name

                }
                setRequest(post)
                console.log(request)
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [id]);
    const navigate = useNavigate();

    const handleAcceptRequest = async () => {
        try {
            const res = await api.post("/api/sessions/request", {
                helpRequestId: Number(id),
                mode
            });

            console.log(res.data);
            navigate('/chat')
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" mt={5}>
                <CircularProgress />
            </Box>
        );
    }

    if (!request) {
        return (
            <Typography align="center" mt={5}>
                Help request not found.
            </Typography>
        );
    }

    return (
        <Box maxWidth="900px" mx="auto" mt={4}>
            <Card elevation={3}>
                <CardContent>

                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        {request.title}
                    </Typography>

                    <Typography color="text.secondary" mb={2}>
                        Posted by <strong>{request.name}</strong>
                    </Typography>

                    <Typography color="text.secondary">
                        {new Date(request.createdAt).toLocaleString()}
                    </Typography>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="h6" gutterBottom>
                        Description
                    </Typography>

                    <Typography sx={{ whiteSpace: "pre-wrap" }}>
                        {request.description}
                    </Typography>

                    <Box mt={4} display="flex" gap={2}>
                        {request.urgency && (
                            <Chip
                                color="error"
                                label={`Urgency: ${request.urgency}`}
                            />
                        )}

                        {request.status && (
                            <Chip
                                color="primary"
                                label={request.status}
                            />
                        )}
                    </Box>
                    <Box mt={4} display="flex" gap={2}>
                        {request.preferredMode == "call" ?
                            <Chip
                                color="success"
                                label={`Mode: ${request.preferredMode}`}
                            /> :
                            <Chip
                                color="secondary"
                                label={`Mode: ${request.preferredMode}`}
                            />

                        }

                        {/* {request.preferredMode && (
                            <Chip
                                color="primary"
                                label={request.preferredMode}
                            />
                        )} */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Select the mode you prefer</InputLabel>
                            <Select
                                value={mode}
                                label="Mode"
                                onChange={(e) => setMode(e.target.value as "call" | "chat")}
                            >
                                <MenuItem value="call">Call</MenuItem>
                                <MenuItem value="chat">Chat</MenuItem>
                            </Select>
                        </FormControl>
                        <Box mt={4}>
                            <Button
                                variant="contained"
                                color="warning"
                                fullWidth
                                onClick={handleAcceptRequest}
                            >
                                Accept Request
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PostPage;