import { useEffect, useMemo, useState } from "react";
import {
    Box,
    Alert,
    Container,
    Typography,
    TextField,
    Grid,
    CircularProgress,
    InputAdornment,
} from "@mui/material";
import axios from 'axios';
import SearchIcon from "@mui/icons-material/Search";
import CommunityCard from "../components/communityCard";
import { type Community } from "../../../types/community";
const API = import.meta.env.VITE_BACKEND_URL
const ExploreCommunities = () => {
    const [communities, setCommunities] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchCommunities = async () => {
            try {
                const response = await axios.get(`${API}/api/communities/all`, { withCredentials: true });
                console.log(response.data.data)
                const data: Community[] = response.data?.data?.map(
                    ({ is_private, created_at, ...rest }: any) => ({
                        ...rest,
                        isPrivate: is_private,
                        createdAt: created_at,
                    })
                );

                setCommunities(data);
            } catch (error) {
                console.error(error);
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchCommunities();
    }, []);

    const filteredCommunities = useMemo(() => {
        return communities.filter((community) =>
            community.name.toLowerCase().includes(search.toLowerCase())
        );
    }, [communities, search]);

    return (
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 5 }, px: { xs: 2, sm: 3 } }}>
            <Typography variant="h3" fontWeight={600}>
                Explore communities
            </Typography>

            <Typography color="text.secondary" sx={{ mt: 0.75, mb: 3 }}>
                Find a group to learn, share questions, and help other students.
            </Typography>

            <TextField
                fullWidth
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 3, maxWidth: 640 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {error && <Alert severity="error" sx={{ mb: 2 }}>Communities could not be loaded. Check your connection and try again.</Alert>}
            {loading ? (
                <Box display="flex" justifyContent="center" mt={8}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {filteredCommunities.map((community) => (
                        <Grid
                            key={community.id}
                            size={{ xs: 12, sm: 6, md: 4 }}
                        >
                            <CommunityCard community={community} />
                        </Grid>
                    ))}
                </Grid>
            )}
            {!loading && !error && filteredCommunities.length === 0 && <Typography color="text.secondary" sx={{ py: 5, textAlign: "center" }}>No communities match that search.</Typography>}
        </Container>
    );
};

// <<<<<<< ours
export default ExploreCommunities;
// =======
// export default ExploreCommunities;
// >>>>>>> theirs
