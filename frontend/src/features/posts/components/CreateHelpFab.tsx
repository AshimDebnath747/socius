import { Fab, Tooltip } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
interface Props {
    onClick: () => void;
}

const CreateHelpFab = ({ onClick }: Props) => (
    <Tooltip title="Create Help Request" arrow placement="left">
        <Fab
            color="primary"
            onClick={onClick}
            sx={{
                position: "fixed",
                bottom: 32,
                right: 32,
            }}
        >
            <AddIcon />
        </Fab>
    </Tooltip>
);

export default CreateHelpFab;