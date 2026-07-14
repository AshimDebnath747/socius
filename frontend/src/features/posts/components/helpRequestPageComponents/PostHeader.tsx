import {
    Avatar,
    Box,
    Card,
    Stack,
    Typography,
} from "@mui/material";

import AccessTimeIcon from "@mui/icons-material/AccessTime";

interface Props {
    title: string;
    name: string;
    createdAt: string;
    avatar?: string | null;
}

const PostHeader = ({
    title,
    name,
    createdAt,
    avatar,
}: Props) => {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 5,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                mb: 3,
            }}
        >
            {/* Header */}
            <Box
                sx={{
                    background:
                        "linear-gradient(135deg,#1976d2,#42a5f5)",
                    color: "white",
                    p: 4,
                }}
            >
                <Typography
                    variant="h3"
                    fontWeight={700}
                >
                    {title}
                </Typography>

                <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    mt={4}
                    flexWrap="wrap"
                >
                    {/* User */}
                    <Stack
                        direction="row"
                        spacing={2}
                        alignItems="center"
                    >
                        <Avatar
                            src={`${import.meta.env.VITE_BACKEND_URL}${avatar}`}
                            sx={{
                                width: 64,
                                height: 64,
                                fontSize: 28,
                                bgcolor: "white",
                                color: "primary.main",
                                fontWeight: 700,
                            }}
                        >
                            {name.charAt(0).toUpperCase()}
                        </Avatar>

                        <Box>
                            <Typography
                                fontWeight={700}
                                fontSize={18}
                            >
                                {name}
                            </Typography>

                            <Typography
                                sx={{
                                    opacity: 0.85,
                                }}
                            >
                                Needs your help
                            </Typography>
                        </Box>
                    </Stack>

                    {/* Date */}
                    <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mt={{ xs: 2, md: 0 }}
                    >
                        <AccessTimeIcon />

                        <Typography>
                            {new Date(
                                createdAt
                            ).toLocaleString()}
                        </Typography>
                    </Stack>
                </Stack>
            </Box>
        </Card>
    );
};

export default PostHeader;