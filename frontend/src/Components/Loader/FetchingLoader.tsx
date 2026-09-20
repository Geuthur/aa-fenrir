// Styles
import styles from "@/Components/Loader/FetchingLoader.module.css";

interface LoaderProps {
  message?: string;
}

export const FetchingLoader = (props: LoaderProps = {}) => {
  return (
    <div className={`${styles["flex-container-loader"]}`}>
      <span className="spinner-border"></span>
      <span className="fs-4">{props.message && <>{props.message}</>}</span>
    </div>
  )
}

export default FetchingLoader
