using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Blazored.LocalStorage;
using ch1seL.Blazored.LocalStorage.Concurrent;
using Microsoft.AspNetCore.Components;

namespace Client.Storage
{
    public class MessageInfoStorage : ConcurrentEntityStorageBase<List<MessageInfo>>, IMessageInfoStorage
    {
        public MessageInfoStorage(ILocalStorageService localStorage, NavigationManager navigationManager) : base(localStorage,
            $"MessageInfos_{GetClientHash(navigationManager)}")
        {
        }

        public async Task<IReadOnlyCollection<MessageInfo>> GetAll()
        {
            return await Request(list => list);
        }

        public async Task<IReadOnlyCollection<MessageInfo>> Push(MessageInfo messageInfo)
        {
            return await Update(list =>
            {
                list.Insert(0, messageInfo);
                return list;
            });
        }

        public async Task ClearAll()
        {
            await Update(list => { list.Clear(); });
        }

        private static string GetClientHash(NavigationManager navigationManager)
        {
            return navigationManager.ToBaseRelativePath(navigationManager.Uri).Split('/').Last();
        }
    }
}