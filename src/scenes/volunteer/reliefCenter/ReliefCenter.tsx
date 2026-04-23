import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Modal,
  Fade,
  Divider,
  Card,
  CardContent,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import useSound from "use-sound";
import Maps from "./Maps";
import { reliefApi } from "../../../api/reliefApi";
import { ReliefCenter as ReliefCenterType } from "../../../types/relief.types";
import { socket } from "../../../store/socket";

const StyledCard: React.FC<{ children: React.ReactNode; sx?: any }> = ({ children, sx }) => (
  <Card
    sx={{
      borderRadius: "1rem",
      boxShadow: "rgba(100, 100, 111, 0.2) 0px 7px 29px 0px",
      backgroundColor: "background.paper",
      p: 2,
      ...sx,
    }}
  >
    <CardContent sx={{ p: 0 }}>{children}</CardContent>
  </Card>
);

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 500, md: 600 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: "1rem",
  outline: "none",
};

const ReliefCenter: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [modalData, setModalData] = useState<ReliefCenterType | null>(null);
  const [rows, setRows] = useState<ReliefCenterType[]>([]);

  const [play] = useSound("/alert.wav", { volume: 0.5 });
  const seenNotificationIds = useRef<Set<string>>(new Set());

  const fetchReliefCenters = async () => {
    try {
      const data = await reliefApi.getAllCenters();
      const dataWithIds = data.map((item) => ({
        ...item,
        id: item._id, // DataGrid requirement
      }));
      setRows(dataWithIds);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load relief centers.");
    }
  };

  useEffect(() => {
    fetchReliefCenters();
    
    socket.on("CENTER_DATA_UPDATED", fetchReliefCenters);
    return () => {
      socket.off("CENTER_DATA_UPDATED", fetchReliefCenters);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/notification/getnotification");
        if (!response.ok) return;
        const data = await response.json();

        if (data && data.length > 0) {
          let newNotificationDetected = false;

          data.forEach((notification: any) => {
            const id = notification._id || notification.id;

            if (!seenNotificationIds.current.has(id)) {
              seenNotificationIds.current.add(id);
              toast.error(
                `🚨 Emergency Alert! Near: Lat ${notification.latitude}, Lon ${notification.longitude}`,
              );
              newNotificationDetected = true;
            }
          });

          if (newNotificationDetected) {
            play();
          }
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [play]);

  const columns: GridColDef[] = [
    { field: "CenterName", headerName: "Center Name", flex: 1, minWidth: 200 },
    { field: "Phone", headerName: "Phone No.", width: 150 },
    { field: "Capacity", headerName: "Capacity", width: 100, type: "number" },
    { field: "Admission", headerName: "Occupied", width: 100, type: "number" },
    {
      field: "Vaccancy",
      headerName: "Vacancy",
      width: 120,
      valueGetter: (params) => params.row.Capacity - params.row.Admission,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: "bold",
            color: (params.value as number) > 0 ? "success.main" : "error.main",
            display: 'flex',
            alignItems: 'center',
            height: '100%'
          }}
        >
          {params.value} Slots
        </Typography>
      ),
    },
    {
      field: "action",
      headerName: "Details",
      width: 100,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => {
            setModalData(params.row);
            setOpen(true);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        🆘 Relief Centers Overview
      </Typography>

      <StyledCard sx={{ mb: 4 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Available Relief Centers
        </Typography>

        <DataGrid
          rows={rows}
          columns={columns}
          getRowId={(row) => row.id || row._id}
          pageSize={5}
          rowsPerPageOptions={[5, 10, 25]}
          autoHeight
        />
      </StyledCard>

      <Typography variant="h5" fontWeight="bold" gutterBottom color="primary">
        📍 Location of All Rescue Centers
      </Typography>

      <StyledCard sx={{ minHeight: "60vh" }}>
        <Maps style={{ width: "100%", height: "100%" }} />
      </StyledCard>

      <Modal open={open} onClose={() => setOpen(false)}>
        <Fade in={open}>
          <Box sx={modalStyle}>
            {modalData && (
              <>
                <Typography variant="h5" fontWeight="bold">
                  {modalData.CenterName}
                </Typography>
                <Divider sx={{ my: 2 }} />

                <Typography sx={{ mb: 1 }}><strong>Phone:</strong> {modalData.Phone}</Typography>
                <Typography sx={{ mb: 1 }}><strong>Capacity:</strong> {modalData.Capacity}</Typography>
                <Typography sx={{ mb: 1 }}><strong>Occupied:</strong> {modalData.Admission}</Typography>
                <Typography sx={{ mb: 2 }}>
                  <strong>Vacancy:</strong> {modalData.Capacity - modalData.Admission}
                </Typography>
                
                <Button variant="contained" fullWidth onClick={() => setOpen(false)}>
                  Close
                </Button>
              </>
            )}
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}

export default ReliefCenter;
