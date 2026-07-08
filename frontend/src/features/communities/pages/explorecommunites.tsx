import { useEffect, useMemo, useState } from "react";
import {
    Box,
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
        <Box sx={{ maxWidth: 1200, mx: "auto", p: 4 }}>
            <Typography variant="h4" fontWeight={700}>
                Explore Communities
            </Typography>

            <Typography color="text.secondary" mb={4}>
                Find communities that match your interests.
            </Typography>

            <TextField
                fullWidth
                placeholder="Search communities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 4 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    ),
                }}
            />

            {loading ? (
                <Box display="flex" justifyContent="center" mt={8}>
                    <CircularProgress />
                </Box>
            ) : (
                <Grid container spacing={3}>
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
        </Box>
    );
};

export default ExploreCommunities;