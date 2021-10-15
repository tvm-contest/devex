using System.Collections.Generic;
using System.Threading.Tasks;

namespace Notifon.Client.Storage {
    public interface IMessageInfoStorage {
        Task Init();
        Task<IReadOnlyCollection<MessageInfo>> GetAll();
        Task<IReadOnlyCollection<MessageInfo>> Push(MessageInfo messageInfo);
        Task Clear();
    }
}