import { useEffect, useState } from "react";
import axios from "axios";
import {
    Avatar,
    Box,
    Chip,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Typography,
} from "@mui/material";

import { type CommunityMember } from "../../posts/types";

const API = import.meta.env.VITE_BACKEND_URL;

interface Props {
    communityId: number;
}

const CommunityMembers = ({ communityId }: Props) => {
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMembers();
    }, [communityId]);

    const fetchMembers = async () => {
        try {
            const response = await axios.get(
                `${API}/api/communities/${communityId}/members`
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
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const roleColor = (role: string) => {
        switch (role) {
            case "owner":
                return "error";
            case "moderator":
                return "warning";
            default:
                return "primary";
        }
    };

    return (
        <Paper elevation={3} sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h5" gutterBottom>
                Community Members
            </Typography>

            <Divider sx={{ mb: 2 }} />

            {loading ? (
                <Box display="flex" justifyContent="center" py={5}>
                    <CircularProgress />
                </Box>
            ) : members.length === 0 ? (
                <Typography color="text.secondary">
                    No members found.
                </Typography>
            ) : (
                <List>
                    {members.map((member) => (
                        <ListItem
                            key={member.id}
                            divider
                            secondaryAction={
                                <Chip
                                    label={member.role}
                                    color={roleColor(member.role)}
                                    size="small"
                                />
                            }
                        >
                            <ListItemAvatar>
                                <Avatar src={`${API}${member.avatar}`}>
                                    {member.name[0]}
                                </Avatar>
                            </ListItemAvatar>

                            <ListItemText
                                primary={member.name}
                                secondary={
                                    <>
                                        {member.email}
                                        <br />
                                        Joined{" "}
                                        {new Date(
                                            member.joinedAt
                                        ).toLocaleDateString()}
                                    </>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}
        </Paper>
    );
};

export default CommunityMembers;