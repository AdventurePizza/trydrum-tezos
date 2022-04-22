// @ts-nocheck
import React, { useCallback } from 'react';


export interface IFirebaseContext {
	firebaseUpdateDrumCount: (amt: number, address: string) => void;
	getDrumCount: (address: string) => Promise<IFetchResponseBase>;
	claim: (address: string) => Promise<IFetchResponseBase>;
	syncRewards: (tempAddress: string, address: string) => void;
	getDrumBalance: (address: string) => Promise<IFetchResponseBase>;
	setMessage: (address: string) => Promise<IFetchResponseBase>;
	getBlockchainMessage: () => Promise<IFetchResponseBase>;
	getProfile: (address: string) => Promise<IFetchResponseBase>;
	setProfile: (address: string, username: string, avatar: string) => Promise<IFetchResponseBase>;

	getBgColorFirebase: () => Promise<IFetchResponseBase>;
	setBgColorFirebase: (colorIndex: number) => Promise<IFetchResponseBase>;

	getVisit: () => Promise<IFetchResponseBase>;
	setVisit: (dayIndex: string) => Promise<IFetchResponseBase>;

}

export const FirebaseContext = React.createContext<IFirebaseContext>({
	firebaseUpdateDrumCount: () => Promise.resolve({ isSuccessful: false }),
	getDrumCount: () => Promise.resolve({ isSuccessful: false }),
	claim: () => Promise.resolve({ isSuccessful: false }),
	syncRewards: () => Promise.resolve({ isSuccessful: false }),
	getDrumBalance: () => Promise.resolve({ isSuccessful: false }),
	getBlockchainMessage: () => Promise.resolve({ isSuccessful: false }),
	getProfile: () => Promise.resolve({ isSuccessful: false }),
	setProfile: () => Promise.resolve({ isSuccessful: false }),

	getBgColorFirebase: () => Promise.resolve({ isSuccessful: false }),
	setBgColorFirebase: () => Promise.resolve({ isSuccessful: false }),

	getVisit: () => Promise.resolve({ isSuccessful: false }),
	setVisit: () => Promise.resolve({ isSuccessful: false }),
});

const fetchBase =
	process.env.NODE_ENV === 'development'
		? ''
		: 'https://peopleparty-server.herokuapp.com';


export const FirebaseProvider: React.FC = ({ children }) => {

	const firebaseUpdateDrumCount = useCallback(
		async (amt: number, address: string): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/drum/${address}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ amt: amt })
			});

			if (fetchRes.ok) {
				return { isSuccessful: true };
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);

	const claim = useCallback(
		async (address: string): Promise<IFetchResponseBase> => {

			const fetchRes = await fetch(fetchBase + `/users/drum/claim/${address}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);

	const getDrumCount = useCallback(
		async (address: string): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/drum/${address}`, {
				method: 'GET'
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}
		},
		[]
	);

	const syncRewards = useCallback(
		async (tempAddress: string, address: string): Promise<IFetchResponseBase> => {

			const fetchRes = await fetch(fetchBase + `/users/drum/sync/${address}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ tempAddress: tempAddress })
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);

	const getDrumBalance = useCallback(
		async (address: string): Promise<IFetchResponseBase> => {

			const fetchRes = await fetch(fetchBase + `/users/drum/getBalance/${address}`, {
				method: 'GET'
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);

	const getBlockchainMessage = useCallback(
		async (): Promise<IFetchResponseBase> => {

			const fetchRes = await fetch(fetchBase + `/users/getBlockchainMessage`, {
				method: 'GET'
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);

	const getProfile = useCallback(
		async (address: string): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/profile/${address}`, {
				method: 'GET'
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}
		},
		[]
	);

	const setProfile = useCallback(
		async (address: string, username: string, avatar: string): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/profile/${address}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ username: username, avatar: avatar })
			});

			if (fetchRes.ok) {
				return { isSuccessful: true };
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);


	const getBgColorFirebase = useCallback(
		async (): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/bgColor`, {
				method: 'GET'
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}
		},
		[]
	);

	const setBgColorFirebase = useCallback(
		async (colorIndex: number): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/bgColor`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ colorIndex: colorIndex })
			});

			if (fetchRes.ok) {
				return { isSuccessful: true };
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);

	const getVisit = useCallback(
		async (): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/visit`, {
				method: 'GET'
			});

			if (fetchRes.ok) {
				return await fetchRes.json();
			}
		},
		[]
	);

	const setVisit = useCallback(
		async (dayIndex: string): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/visit`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ dayIndex: dayIndex })
			});

			if (fetchRes.ok) {
				return { isSuccessful: true };
			}

			return { isSuccessful: false, message: fetchRes.statusText };
		},
		[]
	);

	return (
		<FirebaseContext.Provider
			value={{
				firebaseUpdateDrumCount,
				claim,
				getDrumCount,
				syncRewards,
				getDrumBalance,
				getBlockchainMessage,
				getProfile,
				setProfile,
				getBgColorFirebase,
				setBgColorFirebase,
				getVisit,
				setVisit
			}}
		>
			{children}
		</FirebaseContext.Provider>
	);
};
