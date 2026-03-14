import { useState } from "react";

const CreateCommunityPage = () => {
    const [form, setForm] = useState({
        name: "",
        description: "",
        rules: "",
        is_private: false,
    });
    const [articles, setArticles] = useState<string[]>([]);
    const [article, setArticle] = useState("");
    const [communityCreated, setCommunityCreated] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
        const { name, value, type } = e.target;
        let fieldValue: string | boolean = value;
        if (type === "checkbox") {
            // Only HTMLInputElement has 'checked'
            fieldValue = (e.target as HTMLInputElement).checked;
        }
        setForm((prev) => ({
            ...prev,
            [name]: fieldValue,
        }));
    };

    const handleCommunityCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await fetch("/api/communities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
        });
        if (res.ok) setCommunityCreated(true);
    };

    const handleArticlePost = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setArticles([...articles, article]);
        setArticle("");
    };

    return (
        <div style={{ maxWidth: 600, margin: "auto", padding: 24 }}>
            <h2>Create a Community</h2>
            <form onSubmit={handleCommunityCreate}>
                <input
                    name="name"
                    placeholder="Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                />
                <textarea
                    name="description"
                    placeholder="Description"
                    value={form.description}
                    onChange={handleChange}
                    required
                />
                <textarea
                    name="rules"
                    placeholder="Rules"
                    value={form.rules}
                    onChange={handleChange}
                />
                <label>
                    <input
                        type="checkbox"
                        name="is_private"
                        checked={form.is_private}
                        onChange={handleChange}
                    />{" "}
                    Private
                </label>
                <button type="submit">Create Community</button>
            </form>
            {communityCreated && (
                <div>
                    <h3>Post an Article</h3>
                    <form onSubmit={handleArticlePost}>
                        <textarea
                            value={article}
                            onChange={(e) => setArticle(e.target.value)}
                            placeholder="Write your article..."
                            required
                        />
                        <button type="submit">Post Article</button>
                    </form>
                    <ul>
                        {articles.map((a, i) => (
                            <li key={i}>{a}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default CreateCommunityPage;
