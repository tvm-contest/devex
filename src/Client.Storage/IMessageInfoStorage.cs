using System.Collections.Generic;
using System.Threading.Tasks;

namespace Client.Storage
{
    public interface IMessageInfoStorage
    {
        Task<IReadOnlyCollection<MessageInfo>> GetAll();
        Task<IReadOnlyCollection<MessageInfo>> Push(MessageInfo messageInfo);
        Task ClearAll();
    }
}