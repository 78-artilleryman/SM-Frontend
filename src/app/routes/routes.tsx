import { createBrowserRouter, Outlet } from "react-router-dom";
import LoginPage from "@/pages/LoginPage";
import MainPage from "@/pages/MainPage";
import UserPage from "@/pages/UserPage";
import MyTaskPage from "@/pages/admin/MyTaskPage";
import WorkViewPage from "@/pages/admin/WorkViewPage";
import AddUserPage from "@/pages/admin/AddUserPage";
import ProtectedRoute from "../providers/ProtectedRoute";
import RoleBasedRedirect from "../providers/RoleBasedRedirect";
import Layout from "../layouts/Layout";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/", // 메인 페이지 보호
    element: <ProtectedRoute />, // 로그인 여부 확인
    children: [
      {
        element: <Layout />,
        children: [
          {
            index: true,
            element: <MainPage />,
          },
          {
            path: "mypage",
            element: <RoleBasedRedirect />
          },
          {
            path: "userpage",
            element: <UserPage />
          },
          {
            path: "adminpage",
            element: <Outlet />, 
            children: [
              { path: "mytask", element: <MyTaskPage /> },
              { path: "workview", element: <WorkViewPage /> },
              { path: "adduser", element: <AddUserPage />},
            ]
          }
        ]
      }, 
    ],
  },
]);

export default router;
