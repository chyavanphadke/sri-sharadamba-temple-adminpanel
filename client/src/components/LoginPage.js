import React, { useState } from 'react';
import { Container, Grid, TextField, Button, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Card, CardContent } from '@mui/material';
import { styled } from '@mui/system';

const CurvedImage = styled('img')({
    width: '100%',
    maxWidth: '300px',
    borderRadius: '15px',
    margin: 'auto',
    display: 'block',
});

const StyledButton = styled(Button)(({ theme }) => ({
    marginTop: theme.spacing(2),
}));

const LoginPage = ({ onLogin }) => {
    const [open, setOpen] = useState(false);
    const [loginDetails, setLoginDetails] = useState({ username: '', password: '' });
    const [signUpDetails, setSignUpDetails] = useState({ username: '', password: '', reason: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setLoginDetails({ ...loginDetails, [name]: value });
    };

    const handleSignUpChange = (e) => {
        const { name, value } = e.target;
        setSignUpDetails({ ...signUpDetails, [name]: value });
    };

    const handleLogin = () => {
        if (loginDetails.username === 'admin' && loginDetails.password === 'admin') {
            onLogin();
        } else {
            alert('Invalid credentials');
        }
    };

    const handleSignUp = () => {
        // Handle sign-up logic
        setOpen(false);
    };

    return (
        <Container>
            <Grid container spacing={2} alignItems="center" justifyContent="center" style={{ height: '100vh' }}>
                <Grid item xs={12} md={8}>
                    <Card elevation={5}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} md={6}>
                                    <CurvedImage src="/login-image.jpg" alt="Login" />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Box textAlign="center">
                                        <Typography variant="h4" gutterBottom>
                                            Login
                                        </Typography>
                                        <TextField
                                            label="Username"
                                            name="username"
                                            value={loginDetails.username}
                                            onChange={handleInputChange}
                                            fullWidth
                                            margin="normal"
                                        />
                                        <TextField
                                            label="Password"
                                            name="password"
                                            type="password"
                                            value={loginDetails.password}
                                            onChange={handleInputChange}
                                            fullWidth
                                            margin="normal"
                                        />
                                        <StyledButton variant="contained" color="primary" onClick={handleLogin} fullWidth>
                                            Login
                                        </StyledButton>
                                        <StyledButton variant="outlined" color="secondary" onClick={() => setOpen(true)} fullWidth>
                                            Sign Up
                                        </StyledButton>
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Sign Up</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Preferred Username"
                        name="username"
                        value={signUpDetails.username}
                        onChange={handleSignUpChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Password"
                        name="password"
                        type="password"
                        value={signUpDetails.password}
                        onChange={handleSignUpChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Reason for Access"
                        name="reason"
                        value={signUpDetails.reason}
                        onChange={handleSignUpChange}
                        fullWidth
                        margin="normal"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleSignUp} color="primary">
                        Sign Up
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default LoginPage;
