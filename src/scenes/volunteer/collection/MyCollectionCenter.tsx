import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Grid,
  Modal,
  Stack,
  TextField,
  Typography,
  Badge,
  Paper,
  Divider,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import uuid from "react-uuid";
import { useAppSelector } from "../../../store/hooks";
import { collectionApi } from "../../../api/collectionApi";
import { reliefApi } from "../../../api/reliefApi";
import { CollectionCenter } from "../../../types/collection.types";
import { ReliefSupplyRequest } from "../../../types/relief.types";
import { socket } from "../../../store/socket";

interface CollectionForm {
  CenterName: string;
  Phone: string;
  Address: string;
  email: string;
  latitude: string;
  longitude: string;
}

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 400 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const MyCollectionCenter: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userId = user?._id;
  
  const [open, setOpen] = useState(false);
  const [modalData, setModalData] = useState<ReliefSupplyRequest | null>(null);
  const [rows, setRows] = useState<ReliefSupplyRequest[]>([]);
  const [disRows, setDisRows] = useState<ReliefSupplyRequest[]>([]);
  const [driverNo, setDriverNo] = useState("");
  const [showAccepted, setShowAccepted] = useState(false);
  const [hasCollectionCenter, setHasCollectionCenter] = useState(false);
  const [collectionCenterData, setCollectionCenterData] = useState<CollectionCenter[]>([]);
  const [collectionForm, setCollectionForm] = useState<CollectionForm>({
    CenterName: "",
    Phone: "",
    Address: "",
    email: user?.email || "",
    latitude: "",
    longitude: "",
  });
  const [pageSize, setPageSize] = useState<number>(5);

  const handleClose = () => setOpen(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCollectionForm((prev) => ({ ...prev, [name]: value }));
  };

  const loadData = async () => {
    try {
      if (userId) {
        const data = await collectionApi.getCenterByIncharge(userId);
        const dataArr = Array.isArray(data) ? data : (data ? [data as CollectionCenter] : []);
        setCollectionCenterData(dataArr);
        setHasCollectionCenter(dataArr.length > 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (userId) {
      loadData();
    }
  }, [userId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!collectionForm.latitude || !collectionForm.longitude) {
      toast.error("Location data is missing. Please enable location services.");
      return;
    }

    const form = {
      ...collectionForm,
      latitude: Number(collectionForm.latitude),
      longitude: Number(collectionForm.longitude),
      InCharge: userId,
    };

    try {
      await collectionApi.createCenter(form);
      toast.success("Collection Center Created");
      setCollectionForm({
        CenterName: "",
        Phone: "",
        Address: "",
        email: user?.email || "",
        latitude: "",
        longitude: "",
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create center");
    }
  };

  const refreshRows = async () => {
    try {
      const data = await reliefApi.getSupplyRequests();
      setRows(data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshDispatchRows = async () => {
    try {
      if (userId) {
        const data = await reliefApi.getSupplyRequestsByAccepted(userId);
        setDisRows(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    refreshRows();
    refreshDispatchRows();
    
    const refreshAll = () => {
      refreshRows();
      refreshDispatchRows();
      if (userId) {
        loadData();
      }
    };
    
    socket.on("CENTER_DATA_UPDATED", refreshAll);
    return () => {
      socket.off("CENTER_DATA_UPDATED", refreshAll);
    };
  }, [userId]);

  const acceptDelivery = async (rowData: ReliefSupplyRequest) => {
    let centerName = collectionCenterData[0]?.CenterName;
    
    // If center data hasn't loaded yet for some reason, try to fetch it now
    if (!centerName && userId) {
      try {
        const data = await collectionApi.getCenterByIncharge(userId);
        const dataArr = Array.isArray(data) ? data : (data ? [data as CollectionCenter] : []);
        centerName = dataArr[0]?.CenterName;
      } catch (err) {
        console.error("Failed to fetch center name during acceptance:", err);
      }
    }

    const form = { 
      Status: "accepted", 
      AcceptedBy: userId,
      AcceptedByName: centerName || "A Collection Center"
    };
    try {
      await collectionApi.acceptDelivery(rowData._id, form);
      toast.success("Accepted Successfully");
      refreshRows();
      refreshDispatchRows();
    } catch (err: any) {
      toast.error(err.message || "Failed to accept delivery");
    }
  };

  const dispatchDelivery = async (id: string) => {
    if (!driverNo) {
      return toast.warning("Please enter driver contact number");
    }
    try {
      await collectionApi.dispatchItem(id, { DeliveryContact: driverNo });
      toast.success("Dispatched Successfully");
      refreshRows();
      refreshDispatchRows();
      handleClose();
      setDriverNo("");
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch item");
    }
  };

  const openDispatchModal = (data: ReliefSupplyRequest) => {
    setModalData(data);
    setOpen(true);
  };

  const columns: GridColDef[] = [
    { field: "CenterName", headerName: "Relief Center", width: 200 },
    { field: "ItemName", headerName: "Requested Item", width: 250 },
    { field: "Quantity", headerName: "Quantity", width: 100 },
    { field: "Status", headerName: "Status", width: 120 },
    {
      field: "action",
      headerName: "Action",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          color="primary"
          onClick={() => acceptDelivery(params.row)}
        >
          Accept Request
        </Button>
      ),
    },
  ];

  const dispatchColumns: GridColDef[] = [
    { field: "CenterName", headerName: "Relief Center", width: 200 },
    { field: "ItemName", headerName: "Item", width: 250 },
    { field: "Quantity", headerName: "Quantity", width: 100 },
    { field: "Status", headerName: "Status", width: 120 },
    {
      field: "action",
      headerName: "Action",
      width: 180,
      renderCell: (params) => {
        const status = params.row.Status;
        if (status === 'dispatched') {
          return (
            <Typography variant="body2" color="primary.main" fontWeight="bold">
              🚚 Delivering
            </Typography>
          );
        }
        if (status === 'delivered') {
          return (
            <Typography variant="body2" color="success.main" fontWeight="bold">
              ✅ Delivered
            </Typography>
          );
        }
        return (
          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={() => openDispatchModal(params.row)}
          >
            Dispatch Item
          </Button>
        );
      },
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
        {hasCollectionCenter ? "📍 My Collection Center" : "🏢 Create Collection Center"}
      </Typography>

      {hasCollectionCenter ? (
        <>
          <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
            <Typography variant="h6" color="secondary" gutterBottom>
              {collectionCenterData[0]?.CenterName}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1"><strong>Contact:</strong> {collectionCenterData[0]?.Phone}</Typography>
            <Typography variant="body1" color="textSecondary"><strong>Address:</strong> {collectionCenterData[0]?.Address}</Typography>
          </Paper>

          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">
              {showAccepted ? "📦 Ready for Dispatch" : "📋 Available Requests"}
            </Typography>
            <Badge badgeContent={!showAccepted ? rows.length : 0} color="error">
              <Button variant="outlined" onClick={() => setShowAccepted(!showAccepted)}>
                Switch to {showAccepted ? "Requests" : "Dispatch"}
              </Button>
            </Badge>
          </Stack>

          <Paper elevation={2} sx={{ width: '100%', borderRadius: 2 }}>
            <DataGrid
              autoHeight
              rows={showAccepted ? disRows : rows}
              columns={showAccepted ? dispatchColumns : columns}
              pageSize={pageSize}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              rowsPerPageOptions={[5, 10, 15, 20]}
              getRowId={(row) => row._id || uuid()}
            />
          </Paper>
        </>
      ) : (
        <Paper elevation={3} sx={{ mt: 4, p: 4, borderRadius: 2, maxWidth: 600, mx: "auto" }}>
          <Typography variant="h5" align="center" gutterBottom fontWeight="bold">Establish Center</Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Stack spacing={3}>
              <TextField
                fullWidth
                label="Center Name"
                name="CenterName"
                value={collectionForm.CenterName}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label="Public Phone Number"
                name="Phone"
                value={collectionForm.Phone}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                label="Physical Address"
                name="Address"
                multiline
                rows={2}
                value={collectionForm.Address}
                onChange={handleChange}
                required
              />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    type="email"
                    value={collectionForm.email}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Latitude"
                    name="latitude"
                    type="number"
                    value={collectionForm.latitude}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Longitude"
                    name="longitude"
                    type="number"
                    value={collectionForm.longitude}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>
              <Button type="submit" variant="contained" fullWidth size="large" sx={{ py: 1.5 }}>
                Create Collection Hub
              </Button>
            </Stack>
          </Box>
        </Paper>
      )}

      {/* Dispatch Modal */}
      <Modal open={open} onClose={handleClose}>
        <Box sx={modalStyle}>
          <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">Confirm Outgoing Dispatch</Typography>
          <Divider sx={{ mb: 3 }} />
          {modalData && (
            <Stack spacing={2} mb={4}>
              <Typography><strong>Destination:</strong> {modalData.CenterName}</Typography>
              <Typography><strong>Item:</strong> {modalData.ItemName}</Typography>
              <Typography><strong>Qty:</strong> {modalData.Quantity}</Typography>
            </Stack>
          )}
          <TextField
            fullWidth
            label="Driver/Logistics Contact No"
            variant="outlined"
            placeholder="e.g. +91 9988776655"
            value={driverNo}
            onChange={(e) => setDriverNo(e.target.value)}
            sx={{ mb: 3 }}
          />
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button onClick={handleClose}>Cancel</Button>
            <Button 
              variant="contained" 
              color="success"
              onClick={() => modalData && dispatchDelivery(modalData._id)}
            >
              Dispatch Item
            </Button>
          </Stack>
        </Box>
      </Modal>
    </Container>
  );
}

export default MyCollectionCenter;
