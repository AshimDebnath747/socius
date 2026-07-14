import {
    Button,
    Card,
    CardContent,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Stack,
    Typography,
} from "@mui/material";

import ChatIcon from "@mui/icons-material/Chat";
import CallIcon from "@mui/icons-material/Call";
import HandshakeIcon from "@mui/icons-material/Handshake";

interface Props {
    mode: "call" | "chat";
    setMode: React.Dispatch<
        React.SetStateAction<"call" | "chat">
    >;
    onAccept: () => void;
    loading?: boolean;
}

const HelpRequestAction = ({
    mode,
    setMode,
    onAccept,
    loading = false,
}: Props) => {
    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: 5,
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            <CardContent sx={{ p: 4 }}>
                <Typography
                    variant="h5"
                    fontWeight={700}
                    gutterBottom
                >
                    Offer Your Help
                </Typography>

                <Typography
                    color="text.secondary"
                    mb={3}
                >
                    Select how you'd like to connect with the requester.
                </Typography>

                <FormControl fullWidth>
                    <InputLabel>Preferred Mode</InputLabel>

                    <Select
                        value={mode}
                        label="Preferred Mode"
                        onChange={(e) =>
                            setMode(
                                e.target.value as
                                | "call"
                                | "chat"
                            )
                        }
                    >
                        <MenuItem value="chat">
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <ChatIcon />
                                <Typography>Chat</Typography>
                            </Stack>
                        </MenuItem>

                        <MenuItem value="call">
                            <Stack
                                direction="row"
                                spacing={1}
                                alignItems="center"
                            >
                                <CallIcon />
                                <Typography>Voice Call</Typography>
                            </Stack>
                        </MenuItem>
                    </Select>
                </FormControl>

                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<HandshakeIcon />}
                    sx={{
                        mt: 4,
                        py: 1.6,
                        borderRadius: 3,
                        fontWeight: 700,
                        fontSize: "1rem",
                        textTransform: "none",
                    }}
                    onClick={onAccept}
                    disabled={loading}
                >
                    {loading
                        ? "Sending Request..."
                        : "Accept Help Request"}
                </Button>
            </CardContent>
        </Card>
    );
};

export default HelpRequestAction;