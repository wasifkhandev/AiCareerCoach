import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    IconButton,
    Menu,
    MenuItem,
    useMediaQuery,
    useTheme
} from '@mui/material';
import {
    Menu as MenuIcon,
    Work as WorkIcon,
    Description as DescriptionIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../../actions/auth';

const Navbar = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector(state => state.auth);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        dispatch(logout());
        handleClose();
    };

    const authLinks = (
        <>
            {isMobile ? (
                <>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={handleMenu}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                    >
                        <MenuItem
                            component={RouterLink}
                            to="/jobs"
                            onClick={handleClose}
                        >
                            <WorkIcon sx={{ mr: 1 }} />
                            Job Search
                        </MenuItem>
                        <MenuItem
                            component={RouterLink}
                            to="/mcp"
                            onClick={handleClose}
                        >
                            <AssessmentIcon sx={{ mr: 1 }} />
                            Career Coach
                        </MenuItem>
                        <MenuItem onClick={handleLogout}>
                            Logout
                        </MenuItem>
                    </Menu>
                </>
            ) : (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/jobs"
                        startIcon={<WorkIcon />}
                    >
                        Job Search
                    </Button>
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/mcp"
                        startIcon={<AssessmentIcon />}
                    >
                        Career Coach
                    </Button>
                    <Button
                        color="inherit"
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                </Box>
            )}
        </>
    );

    const guestLinks = (
        <Box>
            <Button
                color="inherit"
                component={RouterLink}
                to="/login"
            >
                Login
            </Button>
            <Button
                color="inherit"
                component={RouterLink}
                to="/register"
            >
                Register
            </Button>
        </Box>
    );

    return (
        <AppBar position="static">
            <Toolbar>
                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    sx={{
                        flexGrow: 1,
                        textDecoration: 'none',
                        color: 'inherit'
                    }}
                >
                    Career AI Coach
                </Typography>
                {isAuthenticated ? authLinks : guestLinks}
            </Toolbar>
        </AppBar>
    );
};

export default Navbar; 