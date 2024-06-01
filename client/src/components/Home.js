import React from 'react';
import { Grid, Paper } from '@mui/material';
import GridItem1 from './GridItem1';
import GridItem2 from './GridItem2';
import GridItem3 from './GridItem3';
import GridItem4 from './GridItem4';

const Home = () => {
    return (
        <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
                <Paper elevation={3}>
                    <GridItem1 />
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={3}>
                    <GridItem2 />
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={3}>
                    <GridItem3 />
                </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
                <Paper elevation={3}>
                    <GridItem4 />
                </Paper>
            </Grid>
        </Grid>
    );
};

export default Home;
