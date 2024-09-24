import { useState, useEffect } from "react";
import { TonConnectButton, useTonConnectUI } from "@tonconnect/ui-react";
import axios from "axios";
import TonWeb from "tonweb";

const API_URL = "https://tonapi.io/v2"; // URL API TonAPI

const App = () => {
  const [nfts, setNfts] = useState<any[]>([]);
  const [rewards, setRewards] = useState<{ [key: number]: string }>({});
  const [tonConnectUI] = useTonConnectUI();

  useEffect(() => {
    const userId = (window as any).userId;
    if (userId) {
      fetchNftData(userId);
    }

    tonConnectUI.onStatusChange(async (wallet: any) => {
      if (wallet) {
        const address = wallet.account.address;
        const base64Address = new TonWeb.utils.Address(address).toString(false); // Преобразование в формат base64
        await fetchNftData(base64Address);
      }
    });

    const intervalId = setInterval(() => {
      const userId = (window as any).userId;
      if (userId) {
        fetchNftData(userId);
      }
    }, 1000); // Обновление данных каждые 2 секунды

    return () => clearInterval(intervalId); // Очистка интервала при размонтировании компонента
  }, [tonConnectUI]);

  const fetchNftData = async (address: string) => {
    try {
      const response = await axios.get(`${API_URL}/accounts/${address}/nfts`);

      if (response.status === 200) {
        const nfts = response.data.nft_items;
        setNfts(nfts);
        console.log(`NFT успешно получены: ${JSON.stringify(nfts)}`);

        const userId = (window as any).userId;
        if (userId) {
          const rewardResponse = await axios.post(`/reward_nft`, {
            user_id: userId,
            nfts: nfts.map((nft: any) => nft.metadata.name),
          });

          if (rewardResponse.status === 200) {
            const rewardsData = rewardResponse.data.rewards;
            const newRewards: { [key: number]: string } = {};
            nfts.forEach((nft: any, index: number) => {
              if (rewardsData[nft.metadata.name]) {
                newRewards[index] = rewardsData[nft.metadata.name];
              }
            });
            setRewards(newRewards);

            await axios.post(`/update_nft_names`, {
              user_id: userId,
              nft_names: nfts.map((nft: any) => nft.metadata.name),
            });
          }
        }
      } else {
        console.error("Ошибка получения NFT:", response.status);
      }
    } catch (error) {
      console.error("Ошибка получения данных NFT:", error);
    }
  };

  const getImageUrl = (nft: any) => {
    if (nft.metadata.image) {
      return nft.metadata.image.replace("http://", "https://");
    }
    if (nft.previews && nft.previews.length > 0) {
      return nft.previews[0].url.replace("http://", "https://");
    }
    return 'https://example.com/placeholder-image.png'; // URL резервного изображения
  };

  return (
    <div className="app">
      <div className="top-bar">
        <TonConnectButton />
      </div>
      <div className="nft-container">
        {nfts.length > 0 ? (
          nfts.map((nft, index) => (
            <div key={index} className="nft-item">
              <img 
                src={getImageUrl(nft)} 
                alt={`NFT ${index + 1}`} 
                className="nft-image" 
              />
              {rewards[index] && (
                <div className="reward">
                  {rewards[index]}
                </div>
              )}
            </div>
          ))
        ) : (
          <p>No NFTs found.</p>
        )}
      </div>
      <div className="button-bar">
        <a href={`index.html?user_id=${(window as any).userId}`} id="home-button">Home</a>
        <a href={`nft.html?user_id=${(window as any).userId}`} id="nft-button">NFT</a>
        <a href={`friends.html?user_id=${(window as any).userId}`} id="friends-button">Friends</a>
        <a href={`earn.html?user_id=${(window as any).userId}`} id="earn-button">Earn</a>
      </div>
    </div>
  );
};

export default App;
