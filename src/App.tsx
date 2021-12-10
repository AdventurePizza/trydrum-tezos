
// @ts-nocheck

import "./App.css";

import { CSSTransition, TransitionGroup } from "react-transition-group"; // ES6
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

//ui
import { IconButton, Button } from "@material-ui/core";
import _ from "underscore";
import drum from "./assets/drum.svg";
import construction from "./assets/construction.png";
import drumBeat from "./assets/drumbeat.mp3";
import musicNote from "./assets/musical-note.svg";

//logic
import io from "socket.io-client";
import { useSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";
import { DAppClient } from "@airgap/beacon-sdk";
import { FirebaseContext } from "./firebaseContext";

const socketURL =
  window.location.hostname === "localhost"
    ? "ws://localhost:8000"
    : "wss://trydrum-backend.herokuapp.com";


const socket = io(socketURL, { transports: ["websocket"] });
const dAppClient = new DAppClient({ name: "Beacon Docs" });
const tempId = uuidv4();

interface INote {
  key: string;
}

function App() {
  const [activeAccount, setActiveAccount] = useState();
  const drumRef = React.createRef<HTMLImageElement>();
  const audioRef = React.createRef<HTMLAudioElement>();
  const _audioRef = useRef<HTMLAudioElement>();
  const toUpdateCountRef = useRef<number>(0);
  const [notes, setNotes] = useState<INote[]>([]);
  const [hasClickedDrum, setHasClickedDrum] = useState(false);
  const { updateDrumCount, claim, getDrumCount, syncRewards } = useContext(
    FirebaseContext
  );
  const [drumCount, setDrumCount] = useState(-1);
  const { enqueueSnackbar } = useSnackbar();
  const [noteCoords, setNoteCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });
	const [synced, setSynced] = useState('sync');
	const [showUnsync, setShowUnsync] = useState(false);
  const [drumReward, setDrumReward] = useState(0);
  const isMobile = window.innerWidth <= 500;

  //fetch wallet name if it exist for example, trydrum.tez
  async function getDomain(address: string) {
    let domain;
    await fetch('https://api.tezos.domains/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
            {
              reverseRecord(address: "`+ address +`"){owner domain{name}}
            }
            `,
        variables: {
        },
      }
      ),
      })
      .then((res) => res.json())
      .then((result) => {
        //console.log(result);	
        if(result.data.reverseRecord){
          domain = result.data.reverseRecord.domain.name;
          setSynced(domain);
        }
      });
  }

  async function getAcc() {
    setActiveAccount( await dAppClient.getActiveAccount());
    if (activeAccount){
      setSynced(activeAccount.address.slice(0, 6) + "..." + activeAccount.address.slice(32, 36) );
      setShowUnsync(true);
      getDomain(activeAccount.address);
    }
    else{
      setSynced('sync');
      setShowUnsync(false);
    }
  }

  useEffect(() => {
		getAcc();
	}, [activeAccount]);

  useEffect(() => {
    if (audioRef.current) {
      _audioRef.current = audioRef.current;
    }
  });

  const setCoords = useCallback(() => {
    if (drumRef.current) {
      const rect = drumRef.current.getBoundingClientRect();
      setNoteCoords({
        top: rect.top - rect.height / 2,
        left: rect.left + rect.width / 2 - 25, // noteWidth = 50
      });
    }
  }, [drumRef]);

  
  useEffect(() => {
    getDrumCount(activeAccount ? activeAccount.address : tempId).then((res) => {
      if(res){
        setDrumCount(res.count);
        setDrumReward(res.claim);
      }
    });
  }, [getDrumCount, activeAccount]);


  useEffect(() => {
    const onDrumbeat = () => {
      if (_audioRef.current) {
        _audioRef.current.currentTime = 0;
        _audioRef.current.play();
        setDrumCount((count) => count + 1);
      }

      setNotes((notes) => notes.concat({ key: uuidv4() }));
      enqueueSnackbar("someone beat the drum!", {
        variant: "default",
      });
    };

    socket.on("drumbeat", onDrumbeat);

    window.addEventListener("resize", setCoords);

    return () => {
      socket.off("drumbeat", onDrumbeat);
      window.removeEventListener("resize", setCoords);
    };
  }, [enqueueSnackbar, setCoords]);

  useEffect(() => {
    if (drumRef.current && (noteCoords.top === 0 || noteCoords.left === 0)) {
      setCoords();
    }
  }, [drumRef, noteCoords, setCoords]);

  const onClickDrum = () => {
    setNotes((notes) => notes.concat({ key: uuidv4() }));
    setHasClickedDrum(true);

    if (audioRef.current) {
      audioRef.current.muted = false;
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }

    socket.emit("drumbeat");

    if (toUpdateCountRef.current !== null) {
      toUpdateCountRef.current++;
      updateDrumCount(toUpdateCountRef.current, activeAccount ? activeAccount.address : tempId);
    } else {
      toUpdateCountRef.current = 0;
    }

    setDrumCount((count) => count + 1);
    setDrumReward((drumReward) => drumReward + 1);
  };

  async function unsync() {
    setActiveAccount( await dAppClient.getActiveAccount())
		if (activeAccount) {
		  // User already has account connected, everything is ready
		  dAppClient.clearActiveAccount().then(async () => {
        setActiveAccount( await dAppClient.getActiveAccount()) 
        setSynced('sync');
        setShowUnsync(false);
        setDrumReward(0);
		  });
		}
	}
	  
	async function sync() {
    setActiveAccount( await dAppClient.getActiveAccount())
    //Already connected
		if (activeAccount) {
      setSynced(activeAccount.address)
			setShowUnsync(true);
      getDomain(activeAccount.address);

      //A call for sending rewards to real account from the temporaray one 
      const updatedBalance = (await syncRewards(tempId, permissions.address)).updatedBalance;
      console.log( updatedBalance)
      setDrumReward(updatedBalance);
		  return activeAccount;
		} 
    // The user is not synced yet
    else {
		  try {
        console.log("Requesting permissions...");
        const permissions = await dAppClient.requestPermissions();
        setActiveAccount( await dAppClient.getActiveAccount())
        console.log("Got permissions:", permissions.address);
        setSynced(permissions.address)
        setShowUnsync(true);

        getDomain(permissions.address);

        //A call for sending rewards to real account from the temporaray one 
        const updatedBalance = (await syncRewards(tempId, permissions.address)).updatedBalance;
        console.log( updatedBalance)
        setDrumReward(updatedBalance);

        getDrumCount(permissions.address).then((res) => {
          if(res){
            setDrumCount(res.count);
            setDrumReward(res.claim);
          }
        });

		  } 
      catch (error) {
			  console.log("Got error:", error);
		  }
		}
	}

  async function claimRewards() {

    enqueueSnackbar("Sending " + drumReward + " DRUM !" , {
      variant: "default",
    });

    const result = await claim(activeAccount ? activeAccount.address : tempId);
    if(result.success){
      enqueueSnackbar( <div onClick={() => { window.open(result.message); }} > hash:  {result.message}  </div>   , {
        variant: "success",
      });
    }else{
      enqueueSnackbar( result.message  , {
        variant: "error",
      });
    }
    setDrumReward(0);
  }

  return (
    <div
      className="app-container"
      style={{ minHeight: window.innerHeight - 10 }}
    >
      <audio src={drumBeat} ref={audioRef} autoPlay muted />

      <div className="top-left" style={{fontSize: isMobile ? "1em" : "1.5em" }} > 	
        drum
      </div>

      <div className="top-middle"> 	
        
      </div>


      {drumCount >= 0 && <div className="top-right" style={{fontSize: isMobile ? "1em" : "1.5em" }}>{drumCount}  </div>}

      <img
        ref={drumRef}
        onClick={onClickDrum}
        alt="drum"
        src={drum}
        className="drum"
      />
      {!hasClickedDrum && <div>Click the drum!</div>}

      <TransitionGroup>
        {notes.map((note) => (
          <CSSTransition
            key={note.key}
            timeout={1000}
            classNames="note-transition"
            onEntered={() => {
              const noteIndex = notes.findIndex(
                (_note) => _note.key === note.key
              );
              setNotes([
                ...notes.slice(0, noteIndex),
                ...notes.slice(noteIndex + 1),
              ]);
            }}
          >
            <img
              alt="music note"
              src={musicNote}
              className="music-note"
              style={{
                top: noteCoords.top,
                left: noteCoords.left,
              }}
            />
          </CSSTransition>
        ))}
      </TransitionGroup>

      <div className="bottom-left" >
        <Button  title={"Adventure Networks"} size={isMobile ? "small" : "medium"}  onClick={() => { window.open('https://adventurenetworks.net/#/'); }} >  <div style={{textAlign: "left"}}> Adventure <br></br>Networks </div> </Button>
      </div>

      <div className="bottom-right">
        <div>  <img style={{width: 30}} src={construction}/> under construction <img style={{width: 30}} src={construction}/> </div>
        <div style={{display: "flex", justifyContent: "flex-end"}}>
        {showUnsync ?
        <Button  title={"claim"} size={isMobile ? "small" : "medium"}  onClick={ async () => { 	await claimRewards();	}} >  Claim {drumReward} DRUM  </Button> 
        :  <div style={{fontSize: isMobile ? "1em" : "1.1em", marginRight: 12 }}> sync to claim {drumReward} DRUM </div>
        }
        </div>

        <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end"}}>
          {showUnsync && <Button size={isMobile ? "small" : "medium"}  title={"unsync"} onClick={() => { unsync() }} ><u>unsync</u> </Button>} 
          
          {showUnsync && <div> | </div>}
          <Button  title={"sync"} size={isMobile ? "small" : "medium"}  onClick={async () => { 	await sync();	}} ><u>{synced}</u> </Button> 
        </div>
      </div>
    </div>
  );
}

export default App;

	//const [xtzPrice, setXtzPrice] = useState(0);
	//const [balance, setBalance] = useState(0);
      /* 
      //set XTZ balance
      fetch('https://api.tzkt.io/v1/accounts/' + activeAccount.address)
      .then(response => response.json())
      .then(data => setBalance(data.balance))

      fetch('https://min-api.cryptocompare.com/data/price?fsym=XTZ&tsyms=USD')
      .then(response => response.json())
      .then(data => setXtzPrice(data.USD))
      */

        /*
        fetch('https://api.tzkt.io/v1/accounts/' + permissions.address)
        .then(response => response.json())
        .then(data => setBalance(data.balance))
        */