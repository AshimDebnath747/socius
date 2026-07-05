export interface Session {
  id: number;
  help_request_id: number;

  requester_id: number;
  helper_id: number;

  mode: "call" | "text" | null;

  start_time: string | null;
  end_time: string | null;

  // Status of the session
  status: "active" | "completed" | "cancelled";

  // Fields from helprequest table
  title: string;
  description: string;

  category_id: number;

  urgency: "low" | "medium" | "high";

  preferred_mode: "call" | "text";

  // Status of the help request
  req_status: "open" | "closed" | "accepted";

  created_by: number;
  created_at: string;

  community_id: number;
}