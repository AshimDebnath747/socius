import {
    Avatar,
    Box,
    Card,
    CardContent,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";

import { type CommunityMember } from "../../posts/types";
const API = import.meta.env.VITE_BACKEND_URL;

interface CommunityMembersCardProps {
    members: CommunityMember[];
    loading: boolean;
}

const CommunityMembersCard = ({
    members,
    loading,
}: CommunityMembersCardProps) => {
    return (
        <Card sx={{
            borderRadius: 3,
        }}>
            <CardContent>
                <Box
                    display="flex"
                    alignItems="center"
                    gap={1}
                    mb={2}
                >
                    <GroupIcon />

                    <Typography variant="h6">
                        Members ({members.length})
                    </Typography>
                </Box>

                {loading ? (
                    <Box display="flex" justifyContent="center" py={2}>
                        <CircularProgress size={25} />
                    </Box>
                ) : members.length === 0 ? (
                    <Typography color="text.secondary">
                        No members found.
                    </Typography>
                ) : (
                    <List sx={{
                        maxHeight: 400,
                        overflowY: "auto",
                    }}>
                        {members.map((member) => (
                            <ListItem divider key={member.id}>
                                <ListItemAvatar>
                                    <Avatar src={`${API}${member.avatar}`}>
                                        {member.name.charAt(0).toUpperCase()}
                                    </Avatar>
                                </ListItemAvatar>

                                <ListItemText
                                    primary={member.name}
                                    secondary={member.email}
                                />
                                <ListItemText
                                    primary={member.role}
                                    secondary={new Date(member.joinedAt).toLocaleDateString()}
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </CardContent>
        </Card>
    );
};

export default CommunityMembersCard;