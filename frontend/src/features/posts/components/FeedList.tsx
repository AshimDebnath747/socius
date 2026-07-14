import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import PostCard from "./PostCard";
import EmptyFeed from "./EmptyFeed";
import type { Post } from "../types";

interface Props {
    posts: Post[];
    search: string;
}

const FeedList = ({ posts, search }: Props) => {
    const navigate = useNavigate();

    const filtered = posts.filter(
        (post) =>
            post.title
                .toLowerCase()
                .includes(search.toLowerCase()) ||
            post.description
                .toLowerCase()
                .includes(search.toLowerCase())
    );

    if (filtered.length === 0)
        return <EmptyFeed />;

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={3}
        >
            {filtered.map((post) => (
                <Box
                    key={post.id}
                    width="100%"
                    maxWidth="750px"
                >
                    <PostCard
                        post={post}
                        onClick={() =>
                            navigate(`/help-request/${post.id}`)
                        }
                    />
                </Box>
            ))}
        </Box>
    );
};

export default FeedList;