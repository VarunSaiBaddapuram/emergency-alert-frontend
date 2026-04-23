import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Container,
  Grid,
  Stack,
  TextField,
  Modal,
  Fade,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { toast } from "react-toastify";
import uuid from "react-uuid";
import { useAppSelector } from "../../../store/hooks";
import { reliefApi } from "../../../api/reliefApi";
import { ReliefCenter, ReliefSupplyRequest } from "../../../types/relief.types";
import { socket } from "../../../store/socket";

interface ReliefForm {
  CenterName: string;
  Phone: string;
  Capacity: string;
  Address: string;
  latitude: string;
  longitude: string;
  email: string;
}

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: 500 },
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const MyReliefCenter: React.FC = () => {
  const [rows, setRows] = useState<ReliefSupplyRequest[]>([]);
  const [hasReliefCenter, setHasReliefCenter] = useState(false);
  const [reliefCenterData, setReliefCenterData] = useState<ReliefCenter[]>([]);
  const [reliefCenterId, setReliefCenterId] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const [accomodationModal, setAccomodationModal] = useState(false);
  const [reliefForm, setReliefForm] = useState<ReliefForm>({
    CenterName: "",
    Phone: "",
    Capacity: "",
    Address: "",
    latitude: "",
    longitude: "",
    email: "",
  });
  const [stateCapacity, setStateCapacity] = useState<number>(0);
  const [updateNumber, setUpdateNumber] = useState(0);
  const [item, setItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [pageSize, setPageSize] = useState<number>(5);

  const { user } = useAppSelector((state) => state.auth);
  const userId = user?._id;

  const getStatusButton = (rowData: ReliefSupplyRequest) => {
    const handleDelivery = async () => {
      try {
        await reliefApi.confirmDelivery(rowData._id);
        toast.success("Delivery Confirmed");
        setRow(); 
      } catch (err: any) {
        toast.error(err.message || "Something went wrong");
      }
    };
    return rowData.Status === "dispatched" ? (
      <Button variant="contained" size="small" color="info" onClick={handleDelivery}>
        Received
      </Button>
    ) : null;
  };

  const columns: GridColDef[] = [
    { field: "CenterName", headerName: "Center Name", width: 200 },
    { field: "ItemName", headerName: "Item", width: 250 },
    { field: "Quantity", headerName: "Quantity", width: 100 },
    { 
      field: "Status", 
      headerName: "Status", 
      width: 250,
      renderCell: (params) => {
        const { Status, AcceptedByName } = params.row;
        if (Status === 'accepted') {
          return `Accepted by ${AcceptedByName || 'a Collection Center'}`;
        }
        if (Status === 'dispatched') {
          return "Out for delivery";
        }
        if (Status === 'delivered') {
          return "Delivered";
        }
        return Status;
      }
    },
    {
      field: "confirm",
      headerName: "Action",
      width: 150,
      renderCell: (params) => getStatusButton(params.row),
    },
  ];

  const setRow = async () => {
    try {
      if (userId) {
        const data = await reliefApi.getSupplyRequestsByCreator(userId);
        setRows(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    try {
      if (userId) {
        const data = await reliefApi.getCenterById(userId);
        if (data && (Array.isArray(data) ? data.length > 0 : data)) {
          const actualData = Array.isArray(data) ? data : [data as ReliefCenter];
          setHasReliefCenter(true);
          setReliefCenterData(actualData);
          setReliefCenterId(actualData[0]._id);
          setUpdateNumber(actualData[0].Admission);
          setStateCapacity(actualData[0].Capacity);
        } else {
          setHasReliefCenter(false);
        }
      }
    } catch (err) {
      console.log(err);
      setHasReliefCenter(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setRow();
      loadData();
      
      const refreshAll = () => {
        setRow();
        loadData();
      };
      
      socket.on("CENTER_DATA_UPDATED", refreshAll);
      return () => {
        socket.off("CENTER_DATA_UPDATED", refreshAll);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setReliefForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const form = { 
      ...reliefForm, 
      latitude: Number(reliefForm.latitude),
      longitude: Number(reliefForm.longitude),
      Capacity: Number(reliefForm.Capacity),
      InCharge: userId 
    };
    try {
      await reliefApi.createCenter(form);
      toast.success("Relief Center Created");
      setReliefForm({
        CenterName: "",
        Phone: "",
        Capacity: "",
        Address: "",
        email: "",
        latitude: "",
        longitude: "",
      });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create center");
    }
  };

  const handleSlotUpdate = async () => {
    try {
      if (reliefCenterId) {
        await reliefApi.updateAdmission(reliefCenterId, updateNumber);
        loadData();
        setAccomodationModal(false);
        toast.success("Vacancy Updated");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update vacancy");
    }
  };

  const handleSupplyRequest = async () => {
    if (!item || !quantity) {
      return toast.warning("Please fill all fields");
    }
    const form = {
      ItemName: item,
      Quantity: quantity,
      CenterName: reliefCenterData[0].CenterName,
      Phone: reliefCenterData[0].Phone,
      Requester: userId,
    };
    try {
      await reliefApi.createSupplyRequest(form);
      toast.success("Request Submitted");
      setRow();
      setOpen(false);
      setItem("");
      setQuantity("");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit request");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {hasReliefCenter ? (
        <>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" fontWeight="bold">My Relief Center</Typography>
            <Button variant="contained" onClick={() => setOpen(true)}>Supply Request</Button>
          </Stack>

          <Paper elevation={2} sx={{ p: 4, mb: 4, borderRadius: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" color="primary" gutterBottom>
                  {reliefCenterData[0]?.CenterName}
                </Typography>
                <Typography variant="body1"><strong>Phone:</strong> {reliefCenterData[0]?.Phone}</Typography>
                <Typography variant="body1">
                  <strong>Vacancy:</strong> {reliefCenterData[0]?.Capacity - reliefCenterData[0]?.Admission} / {reliefCenterData[0]?.Capacity}
                </Typography>
                <Typography variant="body1" color="textSecondary"><strong>Address:</strong> {reliefCenterData[0]?.Address}</Typography>
              </Grid>
              <Grid item xs={12} md={4} display="flex" justifyContent="flex-end" alignItems="center">
                <Button variant="outlined" onClick={() => setAccomodationModal(true)}>
                  Update Vacancy
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Typography variant="h6" fontWeight="bold" gutterBottom>Supply Requests History</Typography>
          <Paper elevation={2} sx={{ width: '100%', borderRadius: 2 }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              pageSize={pageSize}
              onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
              rowsPerPageOptions={[5, 10, 15, 20]}
              getRowId={(row) => row._id || uuid()}
            />
          </Paper>
        </>
      ) : (
        <Paper elevation={3} sx={{ mt: 4, p: 4, borderRadius: 2, maxWidth: 600, mx: "auto" }}>
          <Typography variant="h5" align="center" gutterBottom fontWeight="bold">Register Relief Center</Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Grid container spacing={2}>
              {(Object.keys(reliefForm) as Array<keyof ReliefForm>).map((field) => (
                <Grid item xs={12} key={field}>
                  <TextField
                    label={field.charAt(0).toUpperCase() + field.slice(1)}
                    name={field}
                    fullWidth
                    required
                    size="small"
                    type={field === "email" ? "email" : (field === "Capacity" || field === "latitude" || field === "longitude" ? "number" : "text")}
                    value={reliefForm[field]}
                    onChange={handleChange}
                  />
                </Grid>
              ))}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained" fullWidth size="large">
                  Create Center
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Supply Request Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Fade in={open}>
          <Box sx={modalStyle}>
            <Typography variant="h6" color="primary" gutterBottom>New Supply Request</Typography>
            <Divider sx={{ mb: 3 }} />
            <Stack spacing={3}>
              <TextField
                label="Item Name"
                variant="outlined"
                fullWidth
                value={item}
                onChange={(e) => setItem(e.target.value)}
              />
              <TextField
                label="Quantity Required"
                variant="outlined"
                fullWidth
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={() => setOpen(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleSupplyRequest}>Submit Request</Button>
              </Stack>
            </Stack>
          </Box>
        </Fade>
      </Modal>

      {/* Vacancy Modal */}
      <Modal open={accomodationModal} onClose={() => setAccomodationModal(false)}>
        <Fade in={accomodationModal}>
          <Box sx={{ ...modalStyle, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>Update Center Occupancy</Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Current Occupied Slots: {updateNumber}
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={4} sx={{ mb: 4 }}>
              <Button 
                variant="outlined" 
                disabled={updateNumber === 0}
                onClick={() => setUpdateNumber(updateNumber - 1)}
                sx={{ minWidth: 60, height: 60, fontSize: 24 }}
              >
                -
              </Button>
              <Typography variant="h3" fontWeight={500}>{updateNumber}</Typography>
              <Button 
                variant="outlined" 
                disabled={updateNumber >= stateCapacity}
                onClick={() => setUpdateNumber(updateNumber + 1)}
                sx={{ minWidth: 60, height: 60, fontSize: 24 }}
              >
                +
              </Button>
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button fullWidth variant="outlined" onClick={() => setAccomodationModal(false)}>Cancel</Button>
              <Button fullWidth variant="contained" onClick={handleSlotUpdate}>Update Status</Button>
            </Stack>
          </Box>
        </Fade>
      </Modal>
    </Container>
  );
}

export default MyReliefCenter;
