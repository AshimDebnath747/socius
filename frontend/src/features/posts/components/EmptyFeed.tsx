import { Stack, Typography } from "@mui/material";

const EmptyFeed = ({ searching }: { searching: boolean }) => (
    <Stack alignItems="center" textAlign="center" spacing={1} sx={{ py: 8 }}>
        <Typography variant="h6">{searching ? "No matching requests" : "No open requests right now"}</Typography>
        <Typography color="text.secondary">Try another search or check back later.</Typography>
    </Stack>
);

export default EmptyFeed;
