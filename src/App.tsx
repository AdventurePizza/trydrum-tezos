import "./App.css";

import { CSSTransition, TransitionGroup } from "react-transition-group"; // ES6
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { FirebaseContext } from "./firebaseContext";
import { IconButton, Button } from "@material-ui/core";
import { Twitter } from "@material-ui/icons";
import _ from "underscore";
import drum from "./assets/drum.svg";
//@ts-ignore
import drumBeat from "./assets/drumbeat.mp3";
// import drumBeat from "./assets/leo.mp3";
import io from "socket.io-client";
import musicNote from "./assets/musical-note.svg";
import { useSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";
import { DAppClient } from "@airgap/beacon-sdk";
import { token_transfer } from './token-transfer'

const socketURL ="wss://adventure-drumbeat.herokuapp.com";
// const socketURL = "wss://adventure-drumbeat.herokuapp.com";
const socket = io(socketURL, { transports: ["websocket"] });
const dAppClient = new DAppClient({ name: "Beacon Docs" });
let activeAccount;

interface INote {
  key: string;
}

function App() {
  const drumRef = React.createRef<HTMLImageElement>();
  const audioRef = React.createRef<HTMLAudioElement>();
  const _audioRef = useRef<HTMLAudioElement>();

  const toUpdateCountRef = useRef<number>(0);

  const [notes, setNotes] = useState<INote[]>([]);
  const [hasClickedDrum, setHasClickedDrum] = useState(false);
  const { updateDrumCount: firebaseUpdateDrumCount, getDrumCount } = useContext(
    FirebaseContext
  );

  const [drumCount, setDrumCount] = useState(-1);

  const { enqueueSnackbar } = useSnackbar();

  const [noteCoords, setNoteCoords] = useState<{ top: number; left: number }>({
    top: 0,
    left: 0,
  });

	const [synced, setSynced] = useState('sync');
	const [balance, setBalance] = useState(0);
	const [showUnsync, setShowUnsync] = useState(false);
	const [xtzPrice, setXtzPrice] = useState(0);

  const [drumReward, setDrumReward] = useState(0);
  const isMobile = window.innerWidth <= 500;

  useEffect(() => {
		async function getAcc() {
			activeAccount = await dAppClient.getActiveAccount();
			if (activeAccount){
			  setSynced(activeAccount.address.slice(0, 6) + "..." + activeAccount.address.slice(32, 36) );
        //fetch wallet name if it exist for example, trydrum.tez
			  let domain;
			  await fetch('https://api.tezos.domains/graphql', {
				  method: 'POST',
				  headers: {
					  'Content-Type': 'application/json',
				  },
				  body: JSON.stringify({
					  query: `
							  {
								  reverseRecord(address: "`+ activeAccount.address +`"){owner domain{name}}
							  }
							  `,
					  variables: {
					  },
				  }
				  ),
				  })
				  .then((res) => res.json())
				  .then((result) => {
					  console.log(result);	
					  if(result.data.reverseRecord){
							domain = result.data.reverseRecord.domain.name;
							setSynced(domain);
						}
				  });
			  
			  setShowUnsync(true);
			  
        //set XTZ balance
			  fetch('https://api.tzkt.io/v1/accounts/' + activeAccount.address)
				.then(response => response.json())
				.then(data => setBalance(data.balance))

        fetch('https://min-api.cryptocompare.com/data/price?fsym=XTZ&tsyms=USD')
				.then(response => response.json())
				.then(data => setXtzPrice(data.USD))
			}
      //case its not already synced
			else{
			  setSynced('sync');
			  setShowUnsync(false);
			}
		}
		  getAcc();
	}, []);

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
    getDrumCount().then((count) => {
      setDrumCount(count);
    });
  }, [getDrumCount]);

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
      updateDrumCount();
    } else {
      toUpdateCountRef.current = 0;
    }

    setDrumCount((count) => count + 1);
    setDrumReward((drumReward) => drumReward + 1);
  };

  // eslint-disable-next-line
  const updateDrumCount = useCallback(
    _.throttle(() => {
      if (toUpdateCountRef.current) {
        firebaseUpdateDrumCount(toUpdateCountRef.current);
        toUpdateCountRef.current = 0;
      }
    }, 3000),
    []
  );

  async function unsync() {
		activeAccount = await dAppClient.getActiveAccount();
		if (activeAccount) {
		  // User already has account connected, everything is ready
		  // You can now do an operation request, sign request, or send another permission request to switch wallet
		  dAppClient.clearActiveAccount().then(async () => {
			activeAccount = await dAppClient.getActiveAccount();
	
			setSynced('sync');
			setShowUnsync(false);
			setBalance(0);
		  });
		}
	  }
	  
	async function sync() {
		activeAccount = await dAppClient.getActiveAccount();
		if (activeAccount) {
		  // User already has account connected, everything is ready
		  // You can now do an operation request, sign request, or send another permission request to switch wallet

		  console.log("Already connected:", activeAccount.address);
		  return activeAccount;
		} else {
		  // The user is not connected. A button should be displayed where the user can connect to his wallet.
		  console.log("Not connected!");
		  try {
			console.log("Requesting permissions...");
			const permissions = await dAppClient.requestPermissions();
			console.log("Got permissions:", permissions.address);
			setSynced(permissions.address)
			console.log("reload")
			window.location.reload();
			setShowUnsync(true);

			fetch('https://api.tzkt.io/v1/accounts/' + permissions.address)
			.then(response => response.json())
			.then(data => setBalance(data.balance))
		  } catch (error) {
	
			console.log("Got error:", error);
		  }
		}
	  }

    async function claimRewards() {
      const RPC_URL = 'https://granadanet.api.tez.ie';
      const CONTRACT = 'KT1VGf4ZoNMWNfBTEyBbRTX6q6TgHRnZ24zp' //address of the published contract
      const SENDER =   'tz1aLMj6CXkADSH9tBtRLAcigBqUaSA3sRwx' //public address of the sender (find it in acc.json)
      const RECEIVER = 'tz2KxNHVsBwmPRgMZZKJt3mYnPMcK8Smw49g' // recipient's public address (take it from the Tezos wallet you had created)

      if(drumReward > 0){
        console.log(new token_transfer(RPC_URL).transfer(CONTRACT, SENDER, RECEIVER, drumReward));
        enqueueSnackbar("Recieved " + drumReward + " DRUM !" , {
          variant: "success",
        });
        setDrumReward(0);
      }
      else{
        enqueueSnackbar("You have nothing to claim :(" , {
          variant: "warning",
        });
      }

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
        <Button  title={"Adventure Networks"} size={isMobile ? "small" : "medium"}  onClick={() => { window.open('https://adventurenetworks.net/#/'); }} >Adventure <br></br> Networks </Button>
      </div>

      <div className="bottom-right">

        <div style={{display: "flex", justifyContent: "flex-end"}}>
        <Button  title={"claim"} size={isMobile ? "small" : "medium"}  onClick={ async () => { 	await claimRewards();	}} >  Claim {drumReward} DRUM  </Button> 
        </div>

        <div style={{display: "flex", alignItems: "center", justifyContent: "flex-end"}}>
          {showUnsync && <Button size={isMobile ? "small" : "medium"}  title={"unsync"} onClick={() => { unsync() }} >unsync </Button>} 
          
          {showUnsync && <div> | </div>}
          <Button  title={"sync"} size={isMobile ? "small" : "medium"}  onClick={async () => { 	await sync();	}} >{synced} </Button> 
        </div>
      </div>
    </div>
  );
}

export default App;
