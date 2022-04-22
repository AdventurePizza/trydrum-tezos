
// @ts-nocheck

import "./App.css";

import { CSSTransition, TransitionGroup } from "react-transition-group"; // ES6
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo
} from "react";

//ui
import { IconButton, Button, Select, MenuItem, TextField, Avatar, makeStyles, createStyles, Theme } from "@material-ui/core";
import _ from "underscore";
import drum from "./assets/drum.svg";
import greenDot from "./assets/green_dot.png";
import scroll from "./assets/scroll.png";
import soundOn from "./assets/soundOn.png";
import soundOff from "./assets/soundOff.png";
import drumBeat from "./assets/drumbeat.mp3";
import musicNote from "./assets/musical-note.svg";

//logic
import io from "socket.io-client";
import { useSnackbar } from "notistack";
import { v4 as uuidv4 } from "uuid";
import { DAppClient, TezosOperationType } from "@airgap/beacon-sdk";
import { FirebaseContext } from "./firebaseContext";
import { Cursor, Cursors } from './Cursor';

const socketURL =
  window.location.hostname === "localhost"
    ? "ws://localhost:8000"
    : "wss://peopleparty-server.herokuapp.com";


const socket = io(socketURL, { transports: ["websocket"] });
const dAppClient = new DAppClient({ name: "Beacon Docs" });
const tempId = uuidv4();

interface INote {
  key: string;
}

const versionNames = ["x", "v1.2", "v2.0", "v3.0", "v4.0", "v5.0"];
const playlist = [
  {
    url: "https://archive.org/download/BWV998/00goldberg.mp3",
    name: "J S Bach - BWV998 - The Goldberg aria"
  },
  {
    url: "https://archive.org/download/BWV998/01goldberg.mp3",
    name: "J S Bach - BWV998 - The Goldberg Variation 1"
  },
  {
    url: "https://archive.org/download/BWV998/02goldberg.mp3",
    name: "J S Bach - BWV998 - The Goldberg Variation 2"
  },
  {
    url: "https://archive.org/download/BWV998/03goldberg.mp3",
    name: "J S Bach - BWV998 - The Goldberg Variation 3"
  },
  {
    url: "https://archive.org/download/BWV998/04goldberg.mp3",
    name: "J S Bach - BWV998 - The Goldberg Variation 4"
  },
  {
    url: "https://archive.org/download/BWV998/05goldberg.mp3",
    name: "J S Bach - BWV998 - The Goldberg Variation 5"
  },
  {
    url: "https://archive.org/download/BWV998/06goldberg.mp3",
    name: "J S Bach - BWV998 - The Goldberg Variation 6"
  }
]

const bgColors = ["white", "green", "red", "blue", "cyan", "yellow", "purple", "pink", "gray", "orange"]

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    sizeBig: {
      width: theme.spacing(12),
      height: theme.spacing(12),
    },
    sizeSmall: {
      width: theme.spacing(6),
      height: theme.spacing(6),
    },
  }),
);

function App() {
  const classes = useStyles();
  const [activeAccount, setActiveAccount] = useState();
  const drumRef = React.createRef<HTMLImageElement>();
  const audioRef = React.createRef<HTMLAudioElement>();
  const _audioRef = useRef<HTMLAudioElement>();
  const musicRef = React.createRef<HTMLAudioElement>();
  const _musicRef = useRef<HTMLAudioElement>();
  const toUpdateCountRef = useRef<number>(0);
  const [notes, setNotes] = useState<INote[]>([]);
  const [hasClickedDrum, setHasClickedDrum] = useState(false);
  const { firebaseUpdateDrumCount, claim, getDrumCount, syncRewards, getDrumBalance, getBlockchainMessage, getProfile, setProfile, getBgColorFirebase, setBgColorFirebase, setVisit } = useContext(
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
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [drumBalance, setDrumBalance] = useState(0);
  const [version, setVersion] = useState(5);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showInput, setShowInput] = useState(false);
  const [message, setMessage] = useState();
  const [inputValue, setInputValue] = useState();

  //v4
  const [showPanel, setShowPanel] = useState(true);
  const [collections, setCollections] = useState([]);
  const [username, setUsername] = useState("anon");
  const [avatar, setAvatar] = useState("https://ipfs.io/ipfs/QmVAiRHjVLPJYnf7jCpVeqrqRBE7HFN9nm5ZB2QSZ5BY52");
  const userCursorRef = React.createRef<HTMLDivElement>();
  const [userLocations, setUserLocations] = useState({});

  //v5
  const [bgColor, setBgColor] = useState(0);

  socket.emit('username', username);
  socket.emit('avatar', avatar);

  useEffect(() => {
    /*
    attempt to implement simple analytics 
    1650574800 start time to record visits
    */

    const start = 1650574800000; //april 21 
    const dayInterval = 86400000;
    let timestamp = Date.now();
    setVisit((Math.floor((timestamp - start) / dayInterval)).toString())
  }, []);

  useEffect(() => {
    getProfile(activeAccount ? activeAccount.address : "").then((res) => {
      if (res) {
        socket.emit('username', res.username);
        socket.emit('avatar', res.avatar);
        setUsername(res.username);
        setAvatar(res.avatar);
      }
    });
  }, [getProfile, activeAccount]);

  useEffect(() => {
    async function fetchBgColor() {
      let prevColor = (await getBgColorFirebase()).colorIndex;
      socket.emit('bgColor', (prevColor + 1) % 9);
      setBgColor((prevColor + 1) % 9);
      setBgColorFirebase((prevColor + 1) % 9);
    }
    fetchBgColor();

  }, [setBgColor, setBgColorFirebase, getBgColorFirebase]);

  const onCursorMove = useCallback(
    function cursorMove(
      clientId: string,
      [x, y]: number[],
      clientProfile: IUserProfile
    ) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const absoluteX = width * x;
      const absoluteY = height * y;


      setUserLocations((userLocations) => {
        const newUserLocations = {
          ...userLocations,
          [clientId]: {
            ...userLocations[clientId],
            x: absoluteX,
            y: absoluteY,
            avatar: clientProfile.avatar,
            username: clientProfile.name,
          }
        };
        return newUserLocations;
      });
    },
    []
  );

  useEffect(() => {
    const onRoomateDisconnect = (clientId: string) => {
      setUserLocations((userLocations) => {
        const newUserLocations = {
          ...userLocations
        };
        delete newUserLocations[clientId];

        return newUserLocations;
      });
    };

    const onBgColorChange = (colorIndex: number) => {
      setBgColor(colorIndex)
    };

    socket.on('roommate disconnect', onRoomateDisconnect);
    socket.on('cursor move', onCursorMove);
    socket.on('bgColor', onBgColorChange);

    return () => {
      socket.off('roomate disconnect', onRoomateDisconnect);
      socket.off('cursor move', onCursorMove);
      socket.off('bgColor', onBgColorChange);

    };
  }, [onCursorMove, setBgColor]);

  useEffect(() => {
    async function fetchGraphQL(operationsDoc, operationName, variables) {
      let result = await fetch('https://hdapi.teztools.io/v1/graphql', {
        method: 'POST',
        body: JSON.stringify({
          query: operationsDoc,
          variables: variables,
          operationName: operationName,
        }),
      })

      var ress = await result.json();
      return ress;
    }

    async function fetchCollection(addr) {
      const { errors, data } = await fetchGraphQL(
        query_collection,
        'collectorGallery',
        { address: addr }
      )
      if (errors) {
        console.error(errors)
      }
      const result = data ? data.hic_et_nunc_token_holder : null;
      setCollections(result)
      return result
    }

    if (activeAccount)
      fetchCollection(activeAccount.address);
  }, [activeAccount]);

  const HashToURL = (hash, type) => {
    // when on preview the hash might be undefined.
    // its safe to return empty string as whatever called HashToURL is not going to be used
    // artifactUri or displayUri
    if (hash === undefined) {
      return ''
    }

    switch (type) {
      case 'HIC':
        return hash.replace('ipfs://', 'https://pinata.hicetnunc.xyz/ipfs/')
      case 'CLOUDFLARE':
        return hash.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/')
      case 'PINATA':
        return hash.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
      case 'IPFS':
        return hash.replace('ipfs://', 'https://ipfs.io/ipfs/')
      case 'INFURA':
        try {
          var cidv1 = new ipfsClient.CID(hash.replace('ipfs://', '')).toV1()
          var subdomain = cidv1.toBaseEncodedString('base32')
          return `https://${subdomain}.ipfs.infura-ipfs.io/`
        } catch (err) {
          return undefined
        }
      case 'DWEB':
        return hash.replace('ipfs://', 'http://dweb.link/ipfs/')
      default:
        console.error('please specify type')
        return hash
    }
  }

  const updateCursorPosition = useMemo(
    () =>
      _.throttle((position: [number, number]) => {
        socket.emit('cursor move', { x: position[0], y: position[1] });
      }, 5),
    []
  );

  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      const x = event.clientX;
      const y = event.clientY;

      const width = window.innerWidth;
      const height = window.innerHeight;

      const relativeX = (x - 60) / width;
      const relativeY = (y - 60) / height;

      updateCursorPosition([relativeX, relativeY]);

      if (userCursorRef.current) {
        userCursorRef.current.style.left = x + 20 + 'px';
        userCursorRef.current.style.top = y + 20 + 'px';
      }
    },
    [updateCursorPosition, userCursorRef]
  );

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
  }, [onMouseMove]);

  function getRandomInt(max) {
    return Math.floor(Math.random() * max);
  }
  const [currentIndex, setCurrentIndex] = useState(getRandomInt(playlist.length));

  const handleChange = (event) => {
    setVersion(event.target.value);
  };

  const onUnload = e => {
    e.preventDefault();
    if (toUpdateCountRef.current) {
      firebaseUpdateDrumCount(toUpdateCountRef.current, activeAccount ? activeAccount.address : tempId);
      toUpdateCountRef.current = 0;
    }
  };

  useEffect(() => {
    window.addEventListener("beforeunload", onUnload);

    if (version === 3 && isPlaying) {
      musicRef.current.play();
    } else {
      musicRef.current?.pause();
    }
  }
  )

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
              reverseRecord(address: "`+ address + `"){owner domain{name}}
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
        if (result.data.reverseRecord) {
          domain = result.data.reverseRecord.domain.name;
          setSynced(domain);
        }
      });
  }



  useEffect(() => {
    async function getAcc() {
      setActiveAccount(await dAppClient.getActiveAccount());
      if (activeAccount) {
        setSynced(activeAccount.address.slice(0, 6) + "..." + activeAccount.address.slice(32, 36));
        setShowUnsync(true);
        getDomain(activeAccount.address);
      }
      else {
        setSynced('sync');
        setShowUnsync(false);
      }
    }

    getAcc();

    async function fetchDrumBalance() {
      setDrumBalance((await getDrumBalance(activeAccount ? activeAccount.address : "")).balance);
    }

    async function fetchBlockchainMessage() {
      setMessage((await getBlockchainMessage()).value);
    }

    fetchDrumBalance();
    fetchBlockchainMessage();
  }, [activeAccount, drumBalance, message, getDrumBalance, getBlockchainMessage]);

  useEffect(() => {
    if (audioRef.current) {
      _audioRef.current = audioRef.current;
    }
    if (musicRef.current) {
      _musicRef.current = musicRef.current;
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
      if (res) {
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
      updateDrumCount();
      //updateDrumCount(toUpdateCountRef.current, activeAccount ? activeAccount.address : tempId);
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
        firebaseUpdateDrumCount(toUpdateCountRef.current, activeAccount ? activeAccount.address : tempId);
        toUpdateCountRef.current = 0;
      }
    }, 3000),
    [activeAccount]
  );

  async function unsync() {
    setActiveAccount(await dAppClient.getActiveAccount())
    if (activeAccount) {
      // User already has account connected, everything is ready
      dAppClient.clearActiveAccount().then(async () => {
        setActiveAccount(await dAppClient.getActiveAccount())
        setSynced('sync');
        setShowUnsync(false);
        setDrumReward(0);
      });
    }
  }

  async function sync() {
    setActiveAccount(await dAppClient.getActiveAccount())
    //Already connected
    if (activeAccount) {
      setSynced(activeAccount.address)
      setShowUnsync(true);
      getDomain(activeAccount.address);

      //A call for sending rewards to real account from the temporaray one 
      const updatedBalance = (await syncRewards(tempId, permissions.address)).updatedBalance;
      console.log(updatedBalance)
      setDrumReward(updatedBalance);
      return activeAccount;
    }
    // The user is not synced yet
    else {
      try {
        console.log("Requesting permissions...");
        const permissions = await dAppClient.requestPermissions();
        setActiveAccount(await dAppClient.getActiveAccount())
        console.log("Got permissions:", permissions.address);
        setSynced(permissions.address)
        setShowUnsync(true);

        getDomain(permissions.address);

        //A call for sending rewards to real account from the temporaray one 
        const updatedBalance = (await syncRewards(tempId, permissions.address)).updatedBalance;
        console.log(updatedBalance)
        setDrumReward(updatedBalance);

        getDrumCount(permissions.address).then((res) => {
          if (res) {
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

    enqueueSnackbar("Sending " + drumReward + " DRUM !", {
      variant: "default",
    });

    let newTransaction = { message: "Sending Claim DRUM Request", link: "", color: "black" }
    setTransactions((transaction) => transaction.concat(newTransaction));

    const result = await claim(activeAccount ? activeAccount.address : tempId);
    if (result.success) {
      enqueueSnackbar(<div onClick={() => { window.open(result.message); }} > hash:  {result.message}  </div>, {
        variant: "success",
      });
      setTransactions((transaction) => transaction.concat({ message: "Recieved " + result.amount + " DRUM !", link: result.message, color: "green" }));
    } else {
      enqueueSnackbar(result.message, {
        variant: "error",
      });
      setTransactions((transaction) => transaction.concat({ message: "Failed Transaction", link: "", color: "red" }));
    }
    setDrumReward(0);
  }

  const next = () => {
    if (playlist!.length === 0) {
      return;
    }
    else if (currentIndex === playlist!.length - 1) {
      setCurrentIndex(0);
    }
    else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const onChangeInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const onKeyPressChat = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      try {
        const result = await dAppClient.requestOperation({
          operationDetails: [
            {
              kind: TezosOperationType.TRANSACTION,
              amount: "0",
              destination: "KT194J9NAhWX6PbZzfkL7Fp1ZpN5fndXe3et",
              parameters: {
                entrypoint: "default",
                value: {
                  string: inputValue,
                },
              },
            },
          ],
        });

        console.log(result);
        setInputValue("");
        setShowInput(false);

        enqueueSnackbar(<div onClick={() => { window.open(result.transactionHash); }} > Changed the message ! </div>, {
          variant: "success",
        });

        let newTransaction = { message: "Changed the message !", link: "https://tzkt.io/" + result.transactionHash, color: "green" }
        setTransactions((transaction) => transaction.concat(newTransaction));
      } catch (error) {
        console.log(error);
        enqueueSnackbar(result.message, {
          variant: error.toString(),
        });
        /*console.log(
          `The contract call failed and the following error was returned:`,
          error?.data[1]?.with?.string
        );*/
      }

    }
  };

  return (
    <div
      className="app-container"
      style={{ minHeight: window.innerHeight, overflowX: "hidden", overflowY: "hidden", backgroundColor: bgColors[bgColor] }}

    >
      <Cursor avatar={avatar} userCursorRef={userCursorRef} username={username} />

      <audio src={drumBeat} ref={audioRef} autoPlay muted />
      <audio src={playlist[currentIndex].url} ref={musicRef} autoPlay onEnded={next} />
      {userLocations && Object.entries(userLocations).map(([key]) => (
        <Cursors x={userLocations[key].x} y={userLocations[key].y} avatar={userLocations[key].avatar} username={userLocations[key].username} />
      )
      )
      }
      <div className="top-left" style={{ fontSize: isMobile ? "1em" : "1.5em", display: "flex", alignItems: "center" }} >
        drum

        <div style={{ paddingInline: 20 }}>
          <Select
            value={version}
            label="version"
            onChange={handleChange}
          >
            <MenuItem value={1}> {versionNames[1]}</MenuItem>
            <MenuItem value={2}> {versionNames[2]}</MenuItem>
            <MenuItem value={3}> {versionNames[3]}</MenuItem>
            <MenuItem value={4}> {versionNames[4]}</MenuItem>
            <MenuItem value={5}> {versionNames[5]}</MenuItem>
          </Select>
        </div>

        <img
          alt="status"
          title={"operational, alpha " + versionNames[version]}
          src={greenDot}
          width={isMobile ? 12 : 15}
          height={isMobile ? 12 : 15}
        />
      </div>

      <div className="top-middle">
        {version === 3 &&
          <>
            {message}
            <Button title={"change"} size={isMobile ? "small" : "medium"} onClick={async () => { setShowInput(!showInput) }} >  Change  </Button>
            <br></br>
            {showInput &&
              <TextField
                id="standard-basic"
                label="Change the message in blockchain"
                variant="standard"
                fullWidth
                value={inputValue}
                onChange={onChangeInput}
                onKeyPress={onKeyPressChat}
              />
            }
          </>
        }
      </div>


      {drumCount >= 0 && <div className="top-right" style={{ fontSize: isMobile ? "1em" : "1.5em", textAlign: "end" }}>
        <div style={{ textAlign: "end", paddingRight: "10px", paddingTop: "10px" }}> {drumCount} </div>
      </div>}

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
        <Button title={"Adventure Networks"} size={isMobile ? "small" : "medium"} onClick={() => { }} >  <div style={{ textAlign: "left" }}> Adventure <br></br>Networks </div> </Button>
      </div>

      <div className="bottom-middle">
        {
          version === 3 &&
          <div style={{ textAlign: "center" }}>
            Currently playing: {playlist[currentIndex].name}
          </div>
        }
      </div>

      <div className="bottom" style={{ position: "absolute" }} >
        {(version === 4 || version === 5) &&
          <div   >
            {showPanel &&
              <div className="panel" style={{ display: "flex", width: "100%", overflowY: "auto", marginBottom: 110 }}>
                {collections &&
                  collections.map(({ token }) => (
                    <IconButton
                      key={token.id}
                      onClick={() => {
                        setAvatar(HashToURL(token.display_uri, 'IPFS'));
                        socket.emit('avatar', HashToURL(token.display_uri, 'IPFS'));
                        setProfile(activeAccount.address, username, HashToURL(token.display_uri, 'IPFS'));
                      }}
                    >
                      <Avatar variant="rounded" src={HashToURL(token.display_uri, 'IPFS')} alt={token.id} className={classes.sizeBig} />

                    </IconButton>
                  ))
                }
              </div>
            }
          </div>}
      </div>
      <div className="bottom-right">

        {showTransactions && <div style={{ border: "solid 1px", marginRight: 10, height: isMobile ? 180 : 400, overflowY: "auto", fontSize: isMobile ? "0.9em" : "1.3em", backgroundColor: "white" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 64, height: 10 }}></div>

            Transactions List

            <Button title={"transactions"} size={isMobile ? "small" : "medium"} onClick={async () => { setShowTransactions(false) }} > X </Button>

          </div>
          {transactions &&
            transactions.slice(0).reverse().map((transaction, index) => (
              <div key={index.toString()}>
                {
                  <Button
                    variant="outlined"
                    onClick={() => {
                      if (transaction.link) {
                        window.open(transaction.link);
                      }
                    }}
                    style={{ width: "100%", color: transaction.color }}
                  >
                    {transaction.message}
                  </Button>
                }
              </div>
            ))}
        </div>
        }
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          {showUnsync ?
            <Button title={"claim"} size={isMobile ? "small" : "medium"} onClick={async () => { await claimRewards(); }} >  Claim {drumReward} DRUM  </Button>
            : <div style={{ fontSize: isMobile ? "0.8em" : "0.8em", marginRight: 12 }}> sync to claim {drumReward} DRUM </div>
          }
        </div>
        <div style={{ fontSize: isMobile ? "0.8em" : "1em", textAlign: "end", paddingRight: "10px" }}> Balance: {drumBalance} DRUM </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
          {version === 2 &&
            <div title={"mute/unmute"} style={{ padding: isMobile ? 0 : 10 }}
              onClick={() => {
                if (isPlaying) {
                  musicRef.current.pause()
                }
                else {
                  musicRef.current.play()
                }
                setIsPlaying(!isPlaying);
              }}
            >
              <img
                alt="play / mute"
                title={"play"}
                src={isPlaying ? soundOn : soundOff}
                width={isMobile ? 16 : 20}
                height={isMobile ? 16 : 20}
              />
            </div>
          }
          {showUnsync && <Button size={isMobile ? "small" : "medium"} title={"unsync"} onClick={() => { unsync() }} ><u>unsync</u> </Button>}

          {showUnsync && <div> | </div>}
          <Button title={"sync"} size={isMobile ? "small" : "medium"} onClick={async () => { await sync(); }} ><u>{synced}</u> </Button>
          |
          <Button title={"transactions"} size={isMobile ? "small" : "medium"} onClick={async () => { setShowTransactions(!showTransactions) }} > <img style={{ width: 20 }} alt="transactions" src={scroll} /> </Button>
          {showUnsync && <><div> | </div>
            <Button size={isMobile ? "small" : "medium"} title={"unsync"} onClick={() => { setShowPanel(!showPanel) }} >
              <Avatar variant="rounded" src={avatar} alt="change avatar" className={classes.sizeSmall} />
            </Button>
          </>
          }
        </div>

      </div>
    </div>
  );
}

export default App;

const query_collection = `
query collectorGallery($address: String!) {
  hic_et_nunc_token_holder(where: {holder_id: {_eq: $address}, token: {creator: {address: {_neq: $address}}}, quantity: {_gt: "0"}}, order_by: {token_id: desc}) {
	token {
	  id
	  artifact_uri
	  display_uri
	  thumbnail_uri
	  timestamp
	  mime
	  title
	  description
	  supply
	  royalties
	  creator {
		address
	  }
	}
  }
}
`
