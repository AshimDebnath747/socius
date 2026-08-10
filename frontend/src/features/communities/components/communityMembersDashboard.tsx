import { useEffect, useState } from "react";
import axios from "axios";
import {
    Avatar,
    Box,
    Chip,
    CircularProgress,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Typography,
} from "@mui/material";

import MoreVertIcon from "@mui/icons-material/MoreVert";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import { type CommunityMember } from "../../posts/types";

const API = import.meta.env.VITE_BACKEND_URL;
const user: string | null = localStorage.getItem("user");

let CURRENT_USER_ID: string = "";

if (user) {
    CURRENT_USER_ID = String(JSON.parse(user).id);
}

interface Props {
    communityId: number;
}

const CommunityMembers = ({ communityId }: Props) => {
    const [members, setMembers] = useState<CommunityMember[]>([]);
    const [loading, setLoading] = useState(true);

    // Menu state
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedMember, setSelectedMember] =
        useState<CommunityMember | null>(null);

    useEffect(() => {
        fetchMembers();
    }, [communityId]);

    const fetchMembers = async () => {
        try {
            const response = await axios.get(
                `${API}/api/communities/${communityId}/members`,
                {
                    withCredentials: true,
                }
            );

            const mappedMembers: CommunityMember[] = response.data.data.map(
                ({ id, joined_at, ...rest }: any) => ({
                    ...rest,
                    id: String(id),
                    joinedAt: new Date(joined_at),
                    isCurrentUser: String(id) === CURRENT_USER_ID,
                })
            );

            setMembers(mappedMembers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const currentUserRole = members.find(
        (member) => member.isCurrentUser
    )?.role;

    const canManageMembers =
        currentUserRole === "owner" ||
        currentUserRole === "moderator";
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

    // Open menu
    const handleMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        member: CommunityMember
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedMember(member);
    };

    // Close menu
    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedMember(null);
    };

    // Promote member
    const handlePromote = async (role: string) => {
        if (!selectedMember) return;

        try {
            await axios.put(
                `${API}/api/communities/${communityId}/members/${selectedMember.id}/role`,
                {
                    role
                },
                {
                    withCredentials: true,
                }
            );

            // Update UI immediately
            setMembers((prev) =>
                prev.map((member) =>
                    member.id === selectedMember.id
                        ? {
                            ...member,
                            role: role,
                        }
                        : member
                )
            );

            handleMenuClose();
        } catch (err) {
            console.error("Failed to promote member:", err);
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
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Chip
                                        label={member.role}
                                        color={roleColor(member.role)}
                                        size="small"
                                    />

                                    {/* Don't show menu for owner */}
                                    {member.role !== "owner" && canManageMembers && (
                                        <IconButton
                                            onClick={(event) =>
                                                handleMenuOpen(event, member)
                                            }
                                        >
                                            <MoreVertIcon />
                                        </IconButton>
                                    )}
                                </Box>
                            }
                        >
                            <ListItemAvatar>
                                <Avatar src={`${API}${member.avatar}`}>
                                    {member.name[0]}
                                </Avatar>
                            </ListItemAvatar>

                            <ListItemText
                                primary={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        {member.name}

                                        {member.isCurrentUser && (
                                            <Chip
                                                label="YOU"
                                                size="small"
                                                color="primary"
                                            />
                                        )}
                                    </Box>
                                }
                                secondary={
                                    <>
                                        {member.email}
                                        <br />
                                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                                    </>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            )}

            {/* Member actions menu */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
            >
                {selectedMember?.role === "member" && (
                    <MenuItem onClick={() => handlePromote("moderator")}>
                        <AdminPanelSettingsIcon
                            fontSize="small"
                            sx={{ mr: 1 }}
                        />
                        Promote to Moderator
                    </MenuItem>
                )}

                {selectedMember?.role === "moderator" && (
                    <MenuItem
                        onClick={() => handlePromote("member")}
                    >
                        Remove Moderator Role
                    </MenuItem>
                )}
            </Menu>
        </Paper>
    );
};

export default CommunityMembers;