import React from 'react';
import { AppBar, Toolbar, Typography, Button, Drawer, List, ListItem, ListItemText, CssBaseline, Box } from '@mui/material';
import { Link, Route, Routes, Navigate } from 'react-router-dom';
import Home from './Home';
import SuperAdmin from './SuperAdmin';
import Reports from './Reports';
import Settings from './Settings';

const drawerWidth = 240;

const Dashboard = () => {
    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                <Toolbar>
                    <Button color="inherit" component={Link} to="/" sx={{ marginRight: 'auto' }}>
                        Sign Out
                    </Button>
                    <Typography variant="h6" noWrap component="div">
                        Welcome, {localStorage.getItem('username')}
                    </Typography>
                </Toolbar>
            </AppBar>
            <Drawer
                variant="permanent"
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
                }}
            >
                <Toolbar />
                <Box sx={{ overflow: 'auto' }}>
                    <List>
                        {['Home', 'Super Admin', 'Reports', 'Settings'].map((text) => (
                            <ListItem button key={text} component={Link} to={`/dashboard/${text.toLowerCase().replace(' ', '-')}`}>
                                <ListItemText primary={text} />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            </Drawer>
            <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
                <Toolbar />
                <Routes>
                    <Route path="home" element={<Home />} />
                    <Route path="super-admin" element={<SuperAdmin />} />
                    <Route path="reports" element={<Reports />} />
                    <Route path="settings" element={<Settings />} />
                </Routes>
            </Box>
        </Box>
    );
};

export default Dashboard;
