import { Fab, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
interface Props {
    onClick: () => void;
}

const CreateHelpFab = ({ onClick }: Props) => (
    <Tooltip title="Create Help Request" arrow placement="left">
        <Fab
            aria-label="Create help request"
            color="primary"
            onClick={onClick}
            sx={{
                position: "fixed",
                bottom: { xs: "calc(82px + env(safe-area-inset-bottom))", md: 32 },
                right: { xs: 16, md: 32 },
                borderRadius: 999,
                width: { xs: 56, sm: "fit-content" },
                minWidth: { xs: 56, sm: 160 },
                height: { xs: 56, sm: 48 },
                px: { xs: 0, sm: 2.5 },
                gap: 1,
                whiteSpace: "nowrap",
            }}
        >
            <AddIcon />
            <Typography component="span" sx={{ display: { xs: "none", sm: "inline" }, ml: 1 }}>Create request</Typography>
        </Fab>
    </Tooltip>
);

export default CreateHelpFab;
