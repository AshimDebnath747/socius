import {
    Stack,
    TextField,
    IconButton,
    InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";

interface Props {
    value: string;
    onChange: (value: string) => void;
    onFilterClick: () => void;
}

const FeedSearchBar = ({
    value,
    onChange,
    onFilterClick,
}: Props) => (
    <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        mb={4}
    >
        <TextField
            placeholder="Search help requests..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            sx={{ width: 500 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
        />

        <IconButton
            onClick={onFilterClick}
            sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
            }}
        >
            <FilterListIcon />
        </IconButton>
    </Stack>
);

export default FeedSearchBar;