import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Modal from "@material-ui/core/Modal";

// You can provide fixed values if you want to remove randomness
function getModalStyle() {
  const top = 50;  // Removed randomness for a consistent position
  const left = 50;
  
  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme) => ({
  paper: {
    position: "absolute",
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: "2px solid #000",
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

const SimpleModal = ({ show, handleClose }) => {
  const classes = useStyles();
  const [modalStyle] = React.useState(getModalStyle); // Maintain initial style on first render

  return (
    <Modal
      open={show}
      onClose={handleClose}  // Assuming handleClose is passed from the parent
      aria-labelledby="simple-modal-title"
      aria-describedby="simple-modal-description"
    >
      <div style={modalStyle} className={classes.paper}>
        <h2 id="simple-modal-title">Correct!</h2>
      </div>
    </Modal>
  );
};

export default SimpleModal;
