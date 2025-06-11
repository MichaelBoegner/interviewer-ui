import { useEffect } from "react";

export default function useNavigationGuard(isBlocking) {
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isBlocking) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    const handleClick = (e) => {
      if (!isBlocking) return;

      const anchor = e.target.closest("a");
      if (anchor && anchor.href && anchor.target !== "_blank") {
        const confirmLeave = window.confirm(
          "A message is still processing. Leaving now before processing ends may contaminate your interview data!"
        );
        if (!confirmLeave) {
          e.preventDefault();
        }
      }
    };

    const handlePopState = (e) => {
      if (isBlocking) {
        const confirmLeave = window.confirm(
          "A message is still processing. Leaving now before processing ends may contaminate your interview data!"
        );
        if (!confirmLeave) {
          window.history.pushState(null, "", window.location.href);
        }
      }
    };

    if (isBlocking) {
      window.history.pushState(null, "", window.location.href);
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isBlocking]);
}
