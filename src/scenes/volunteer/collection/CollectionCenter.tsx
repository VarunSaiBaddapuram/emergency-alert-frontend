import React, { useEffect, useState } from "react";
import { Box, Container, Grid, Typography, Paper, Divider, Stack } from "@mui/material";
import { collectionApi } from "../../../api/collectionApi";
import { toast } from "react-toastify";
import Maps from "../reliefCenter/Maps";
import { CollectionCenter as CollectionCenterType } from "../../../types/collection.types";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import { socket } from "../../../store/socket";

const CollectionCenter: React.FC = () => {
  const [centers, setCenters] = useState<CollectionCenterType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCenters = async () => {
      try {
        const data = await collectionApi.getAllCenters();
        setCenters(data);
      } catch (err) {
        toast.error("Failed to load collection centers");
      } finally {
        setLoading(false);
      }
    };
    fetchCenters();
    
    socket.on("CENTER_DATA_UPDATED", fetchCenters);
    return () => {
      socket.off("CENTER_DATA_UPDATED", fetchCenters);
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        📦 Collection Centers
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 4 }}>
        Find donation collection points and distribution hubs managed by our partners.
      </Typography>
      <Divider sx={{ mb: 4 }} />

      {loading ? (
        <Typography align="center">Loading collection centers...</Typography>
      ) : (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {centers.map((center) => (
            <Grid item xs={12} md={6} key={center._id}>
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  borderRadius: 2,
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}
              >
                <Typography variant="h6" fontWeight="bold" color="primary.main">
                  {center.CenterName}
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <PhoneIcon color="action" fontSize="small" sx={{ mt: 0.3 }} />
                    <Typography variant="body2"><strong>Phone:</strong> {center.Phone}</Typography>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <LocationOnIcon color="action" fontSize="small" sx={{ mt: 0.3 }} />
                    <Typography variant="body2" color="textSecondary">{center.Address}</Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Grid>
          ))}
          {centers.length === 0 && (
            <Grid item xs={12}>
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#f8f9fa' }}>
                <Typography color="textSecondary">No collection centers registered yet.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
        📍 Geographic Distribution
      </Typography>
      <Paper elevation={2} sx={{ p: 1, borderRadius: 2, overflow: "hidden", minHeight: "50vh" }}>
        <Maps style={{ width: "100%", height: "100%" }} />
      </Paper>
    </Container>
  );
}

export default CollectionCenter;
