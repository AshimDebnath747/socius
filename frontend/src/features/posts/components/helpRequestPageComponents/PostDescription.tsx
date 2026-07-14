import {
    Card,
    CardContent,
    Divider,
    Typography,
} from "@mui/material";

interface Props {
    description: string;
}

const PostDescription = ({ description }: Props) => {
    return (
        <Card
            elevation={0}
            sx={{
                height: "100%",
                borderRadius: 5,
                border: "1px solid",
                borderColor: "divider",
            }}
        >
            <CardContent sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
            }}>
                <Typography
                    variant="h5"
                    fontWeight={700}
                    gutterBottom
                >
                    Description
                </Typography>

                <Divider sx={{ mb: 3 }} />

                <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{
                        lineHeight: 2,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        fontSize: "1rem",
                    }}
                >
                    {description}
                </Typography>
            </CardContent>
        </Card>
    );
};

export default PostDescription;