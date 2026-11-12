import {
    Stack,
    TextField,
    InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";

interface Props {
    value: string;
    onChange: (value: string) => void;
}

const FeedSearchBar = ({
    value,
    onChange,
}: Props) => (
    <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ width: "100%", maxWidth: 760, mb: { xs: 3, sm: 4 } }}
    >
        <TextField
            placeholder="Search help requests..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            sx={{ flex: 1 }}
            InputProps={{
                startAdornment: (
                    <InputAdornment position="start">
                        <SearchIcon />
                    </InputAdornment>
                ),
            }}
        />

    </Stack>
);

export default FeedSearchBar;
