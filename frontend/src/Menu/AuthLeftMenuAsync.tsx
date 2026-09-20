// React
import ReactDOM from "react-dom";

// Third Party
import { useQuery } from "@tanstack/react-query";

import { loadMenu } from "@/Api/ApiCalls";
import { queryKeys } from "@/Api/query";
import AuthLeftMenu from "@/Menu/AuthLeftMenu";

const AuthLeftMenuAsync = () => {
  const menuRoot = typeof document !== "undefined" ? document.getElementById("nav-left") : null;
  const { isLoading, error, data } = useQuery({
    queryKey: queryKeys.Menu,
    queryFn: () => loadMenu(),
    refetchOnWindowFocus: false,
  });

  if (!menuRoot || !data?.left_links) {
    return <></>;
  }

  return ReactDOM.createPortal(
    <AuthLeftMenu error={error ? true : false} isLoading={isLoading} data={data.left_links} />,
    menuRoot,
  );
};

export default AuthLeftMenuAsync;

