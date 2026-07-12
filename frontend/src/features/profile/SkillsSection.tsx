// import {
//   Card,
//   CardContent,
//   Chip,
//   Divider,
//   Stack,
//   Typography,
// } from "@mui/material";

// const skills = [
//   "React",
//   "TypeScript",
//   "Node.js",
//   "Express",
//   "PostgreSQL",
//   "MongoDB",
//   "Python",
//   "Java",
//   "C++",
//   "Git",
//   "Docker",
//   "Problem Solving",
// ];

// const SkillsSection = () => {
//   return (
//     <Card
//       elevation={2}
//       sx={{
//         borderRadius: 4,
//       }}
//     >
//       <CardContent sx={{ p: 4 }}>
//         <Typography
//           variant="h5"
//           fontWeight={700}
//           gutterBottom
//         >
//           Skills
//         </Typography>

//         <Divider sx={{ mb: 3 }} />

//         <Stack
//           direction="row"
//           flexWrap="wrap"
//           gap={2}
//         >
//           {skills.map((skill) => (
//             <Chip
//               key={skill}
//               label={skill}
//               clickable
//               color="primary"
//               variant="outlined"
//               sx={{
//                 px: 1,
//                 py: 2.5,
//                 fontSize: "0.95rem",
//                 fontWeight: 600,
//                 borderRadius: "10px",
//                 transition: ".2s",

//                 "&:hover": {
//                   backgroundColor: "#2563EB",
//                   color: "#fff",
//                   transform: "scale(1.05)",
//                 },
//               }}
//             />
//           ))}
//         </Stack>
//       </CardContent>
//     </Card>
//   );
// };

// export default SkillsSection;