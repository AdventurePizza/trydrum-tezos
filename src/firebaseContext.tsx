// @ts-nocheck
import React, { useCallback, useContext, useEffect } from 'react';


export interface IFirebaseContext {
	firebaseUpdateDrumCount: (amt: number, address: string) => void;
	getDrumCount: (address: string) => Promise<IFetchResponseBase>;
	claim: (address: string) => Promise<IFetchResponseBase>;
	syncRewards: (tempAddress: string, address: string) => void;
	getDrumBalance: (address: string) => Promise<IFetchResponseBase>;
}

export const FirebaseContext = React.createContext<IFirebaseContext>({
	firebaseUpdateDrumCount: () => Promise.resolve({ isSuccessful: false }),
	getDrumCount: () => Promise.resolve({ isSuccessful: false }),
	claim: () => Promise.resolve({ isSuccessful: false }),
	syncRewards: () => Promise.resolve({ isSuccessful: false }),
	getDrumBalance: () => Promise.resolve({ isSuccessful: false }),
});

const fetchBase =
	process.env.NODE_ENV === 'development'
		? ''
		: 'https://trydrum-backend.herokuapp.com';


export const FirebaseProvider: React.FC = ({ children }) => {

	const firebaseUpdateDrumCount = useCallback(
		async (amt: number, address: string): Promise<IFetchResponseBase> => {
			const fetchRes = await fetch(fetchBase + `/users/drum/${address}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ amt: amt})
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
				return  await fetchRes.json();
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
				return  await fetchRes.json();
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
				body: JSON.stringify({ tempAddress: tempAddress})
			});

			if (fetchRes.ok) {
				return  await fetchRes.json();
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
				return  await fetchRes.json();
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
				getDrumBalance
			}}
		>
			{children}
		</FirebaseContext.Provider>
	);
};
