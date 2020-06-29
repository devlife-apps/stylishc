import React from 'react';
import './App.css';
import Paper from '@material-ui/core/Paper';

import { Button, Typography, Grid, CssBaseline, makeStyles, TextField, Slider, ButtonGroup } from '@material-ui/core';
import Profile from './preview';
import * as styles from '@devlife-apps/stylishc/lib/styles';

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100vh',
  },
  image: {
    backgroundImage: 'url(https://source.unsplash.com/random)',
    backgroundRepeat: 'no-repeat',
    backgroundColor:
      theme.palette.type === 'light' ? theme.palette.grey[50] : theme.palette.grey[900],
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  paper: {
    margin: theme.spacing(8, 4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  avatar: {
    margin: theme.spacing(1),
    backgroundColor: theme.palette.secondary.main,
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

function App() {
  const classes = useStyles();

  return (
    <Grid container component="main" className={classes.root}>
      <CssBaseline />
      <Grid item xs={false} sm={4} md={7}>
        <Profile 
          owner="devlife-apps" 
          repo="stylishc"
          avatarPadding={styles.defaultStyle.avatarPadding}
          avatarRadius={styles.defaultStyle.avatarRadius}
          avatarSize={styles.defaultStyle.avatarSize}
          canvasColor={styles.defaultStyle.canvasColor}
          canvasWidth={styles.defaultStyle.canvasWidth}
          strokeColor={styles.defaultStyle.strokeColor}
          strokeWidth={styles.defaultStyle.strokeWidth}
          />
      </Grid>
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <div className={classes.paper}>
          <form className={classes.form} noValidate>
            <Typography gutterBottom>
              Avatar Style
            </Typography>
            <ButtonGroup color="primary" aria-label="outlined primary button group">
              <Button>Square</Button>
              <Button>Rounded</Button>
              <Button>Circle</Button>
            </ButtonGroup>
            <Typography gutterBottom>
              Avatar Padding
            </Typography>
            <ButtonGroup color="primary" aria-label="outlined primary button group">
              <Button>Compact</Button>
              <Button>Cozy</Button>
              <Button>Comfortable</Button>
            </ButtonGroup>
            <Typography gutterBottom>
              Avatar Size
            </Typography>
            <ButtonGroup color="primary" aria-label="outlined primary button group">
              <Button>Small</Button>
              <Button>Medium</Button>
              <Button>Large</Button>
            </ButtonGroup>
            <TextField label="Canvas Color" value="#FFF0" />
            <Typography gutterBottom>
              Canvas Width
            </Typography>
            <Slider
              defaultValue={900}
              valueLabelDisplay="auto"
              step={10}
              marks
              min={400}
              max={1020}
            />
            <TextField label="Stroke Color" value="#FFF0" />
            <Typography gutterBottom>
              Stroke Width
            </Typography>
            <Slider
              defaultValue={2}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={0}
              max={10}
            />
            <Button>Test</Button>
          </form>
        </div>
      </Grid>
    </Grid>
  );
}

export default App;
