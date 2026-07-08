import {
    Card,
    CardContent,
    Typography,
    Chip,
    Button,
    Stack,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import LockIcon from "@mui/icons-material/Lock";
import PublicIcon from "@mui/icons-material/Public";
import GroupsIcon from "@mui/icons-material/Groups";
import { type Community } from "../../../types/community";

interface CommunityCardProps {
    community: Community;
}

const CommunityCard = ({ community }: CommunityCardProps) => {
    return (
        <Card
            sx={{

                height: "100%",
                borderRadius: 3,
                transition: "all 0.3s ease",
                cursor: "pointer",
                "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: 8,
                },
            }}
        >
            <CardContent>
                <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                >
                    <Typography variant="h6" fontWeight={700}>
                        {community.name}
                    </Typography>

                    <Chip
                        size="small"
                        color={community.isPrivate ? "warning" : "success"}
                        icon={
                            community.isPrivate ? (
                                <LockIcon fontSize="small" />
                            ) : (
                                <PublicIcon fontSize="small" />
                            )
                        }
                        label={community.isPrivate ? "Private" : "Public"}
                    />
                </Stack>

                <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                        minHeight: 70,
                        mb: 2,
                    }}
                >
                    {community.description}
                </Typography>

                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={2}
                >
                    <GroupsIcon fontSize="small" color="action" />

                    <Typography
                        variant="caption"
                        color="text.secondary"
                    >
                        {community.slug}
                    </Typography>
                </Stack>

                <Button
                    component={RouterLink}
                    to={`/explorecommunities/${community.slug}`}
                    variant="contained"
                    fullWidth
                    sx={{
                        borderRadius: 2,
                        textTransform: "none",
                    }}
                >
                    View Community
                </Button>
            </CardContent>
        </Card>
    );
};

export default CommunityCard;