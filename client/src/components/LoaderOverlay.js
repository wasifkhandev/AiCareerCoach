import React from 'react';
import { Backdrop, CircularProgress, Typography, Box } from '@mui/material';

const LoaderOverlay = ({ open, message = 'Loading...' }) => (
  <Backdrop
    sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, flexDirection: 'column' }}
    open={open}
  >
    <CircularProgress color="inherit" size={60} thickness={4.5} />
    <Box mt={3}>
      <Typography variant="h6" sx={{ fontWeight: 500, letterSpacing: 1 }}>
        {message}
      </Typography>
    </Box>
  </Backdrop>
);

export default LoaderOverlay; 