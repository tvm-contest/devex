<script>
  import { Button } from "svelte-chota";
  import { getContext } from "svelte";
  import i18n from "./../i18n.js";
  import { approve } from "./../../lib/Callbacks.js";
  export let modalData = {};

  //Context
  const { closeModal } = getContext("app_functions");

  const approveDialog = () => {
    modalData.resolve({approved: true});
    approve.set({});
    closeModal();
  }

  const cancelDialog = () => {
    modalData.resolve({approved: false});
    approve.set({});
    closeModal();
  }

  const amountView = (amount) => {
    if (!isNaN(Number(amount).valueOf())) {
      return Number(amount).valueOf()/10**9;
    }
  }
</script>

<style>
  .approveDialog {
    padding-top: 20px !important;
  }
</style>

<div class="card">
  <h3>{i18n('approveDialog.title')}</h3>
  
  <div class="approveDialog">
    {#if modalData.activity && modalData.activity.type == 'Transaction'}
      <table>
        <tbody>
          <tr>
            <td>{i18n('approveDialog.type')}</td>
            <td>{ modalData.activity.type }</td>
          </tr>
          <tr>
            <td>{i18n('approveDialog.dst')}</td>
            <td>
              <div title="{ modalData.activity.dst }" data-dst="{ modalData.activity.dst }">{`${modalData.activity.dst.substr(0, 8)}...${modalData.activity.dst.substr(-6)}`}</div>
            </td>
          </tr>
          <tr>
            <td>{i18n('approveDialog.fee')}</td>
            <td>
              <div class="amount">
                <span class="text-overline">{ amountView(modalData.activity.fee) } TON</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    {/if}
    {#if modalData.activity && modalData.activity.out.length > 0}
      <h5>{i18n('approveDialog.outs')}</h5>
      <table>
        <thead>
          <tr>
            <th>{i18n('approveDialog.amount')}</th>
            <th>{i18n('approveDialog.dst1')}</th>
          </tr>
        </thead>
        <tbody>
        {#each modalData.activity.out as item, i}
          <tr data-key="{i}">
            <td>
              <div class="amount">
                <span class="text-overline">{ amountView(item.amount) } TON</span>
              </div>
            </td>
            <td>
              <div title="{ item.dst }" data-dst="{item.dst}">{`${item.dst.substr(0, 8)}...${item.dst.substr(-6)}`}</div>
            </td>
          </tr>
        {/each}
        </tbody>
      </table>
    {:else}
      <div class="error">{i18n('approveDialog.unknown')}</div>
    {/if}
  </div>
  <Button on:click={cancelDialog} class="error">{i18n('approveDialog.reject')}</Button>
  <Button on:click={approveDialog} class="primary">{i18n('approveDialog.approve')}</Button>
</div>