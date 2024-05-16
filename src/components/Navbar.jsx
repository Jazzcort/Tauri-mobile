import DehazeIcon from "@mui/icons-material/Dehaze";
import IconButton from "@mui/material/IconButton";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import "../styles/Navbar.css"
export default function Navbar() {
    return (
        <div className="navbar-main">
            <button>
                <DehazeIcon />
            </button>
            <p>Tauri App</p>
            <button>
                <AccountCircleIcon />
            </button>
        </div>
    );
}
