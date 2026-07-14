import { Container, Tooltip, Box } from "@mui/material";
import { useEffect, useState } from "react";
import type { Post, HelpRequestResponse } from "../types";
import Loader from "../../../components/loader";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/axios";
import FeedHeader from "../components/FeedHeader";
import FeedSearchBar from "../components/FeedSearchBar";
import CreateHelpFab from "../components/CreateHelpFab";
import FeedList from "../components/FeedList";
/* 🔹 Local type */
// interface Post {
//   id: string;
//   title: string;
//   content: string;
//   author: string;
//   createdAt: string;
// }
const user: string | null = localStorage.getItem("user")
console.log("user :", user)
let CURRENT_USER_ID: string = ""

const FeedPage = () => {

  const navigate = useNavigate()
  const [search, setSearch] = useState<string>("");
  const [data, setData] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  useEffect(() => {
    const func = async () => {
      try {
        const API = import.meta.env.VITE_BACKEND_URL;
        const res = await api.get(`${API}/api/help-requests?status=open`);
        if (user) CURRENT_USER_ID = String(JSON.parse(user).id);
        console.log(res.data)
        const data = res.data.data
          .filter(
            ({ created_by }: HelpRequestResponse) => String(created_by) !== CURRENT_USER_ID
          )
          .map(
            ({
              category_id,
              community_id,
              created_at,
              created_by,
              name,
              preferred_mode,
              ...rest
            }: HelpRequestResponse) => ({
              ...rest,
              categoryId: category_id,
              communityId: community_id,
              createdAt: created_at,
              createdBy: created_by,
              name,
              preferredMode: preferred_mode,
            })
          );

        setData(data)
        setLoading(false)
      } catch (err) {
        console.log(err)
      }
    };

    func();
  }, []);
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>

      {/* <FeedHeader /> */}

      <FeedSearchBar
        value={search}
        onChange={setSearch}
        onFilterClick={() => { }}
      />
      {loading && <Loader />}
      <FeedList
        posts={data}
        search={search}
      />

      <CreateHelpFab
        onClick={() => navigate("/helprequest")}
      />
    </Container>
  );
};

export default FeedPage;