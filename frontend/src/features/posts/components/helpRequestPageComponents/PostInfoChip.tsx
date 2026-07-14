import {
    Card,
    CardContent,
    Chip,
    Divider,
    Stack,
    Typography,
} from "@mui/material";

import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ChatIcon from "@mui/icons-material/Chat";
import CallIcon from "@mui/icons-material/Call";
import VideocamIcon from "@mui/icons-material/Videocam";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import CategoryIcon from "@mui/icons-material/Category";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

interface Props {
    urgency: string;
    preferredMode: string;
    status: string;
    category?: string;
}

const PostInfoChips = ({
    urgency,
    preferredMode,
    status,
    category,
}: Props) => {
    const getUrgencyColor = () => {
        switch (urgency.toLowerCase()) {
            case "high":
                return "error";
            case "medium":
                return "warning";
            default:
                return "success";
        }
    };

    const getModeIcon = () => {
        switch (preferredMode.toLowerCase()) {
            case "chat":
                return <ChatIcon />;
            case "call":
                return <CallIcon />;
            case "video":
            case "video call":
                return <VideocamIcon />;
            default:
                return <ChatIcon />;
        }
    };

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 4,
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            <CardContent>
                <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={2}
                >
                    <InfoOutlinedIcon color="primary" />

                    <Typography
                        variant="h6"
                        fontWeight={700}
                    >
                        Request Details
                    </Typography>
                </Stack>

                <Divider sx={{ mb: 3 }} />

                <Stack spacing={2}>
                    <Chip
                        icon={<WarningAmberIcon />}
                        label={`Urgency: ${urgency}`}
                        color={getUrgencyColor()}
                        sx={{
                            justifyContent: "flex-start",
                            py: 2.5,
                        }}
                    />

                    <Chip
                        icon={getModeIcon()}
                        label={`Preferred Mode: ${preferredMode}`}
                        color="primary"
                        variant="outlined"
                        sx={{
                            justifyContent: "flex-start",
                            py: 2.5,
                        }}
                    />

                    <Chip
                        icon={<CheckCircleOutlineIcon />}
                        label={`Status: ${status}`}
                        color="secondary"
                        variant="outlined"
                        sx={{
                            justifyContent: "flex-start",
                            py: 2.5,
                        }}
                    />

                    {category && (
                        <Chip
                            icon={<CategoryIcon />}
                            label={`Category: ${category}`}
                            color="info"
                            variant="outlined"
                            sx={{
                                justifyContent: "flex-start",
                                py: 2.5,
                            }}
                        />
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
};

export default PostInfoChips;