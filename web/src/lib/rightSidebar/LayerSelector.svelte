<script lang="ts">
    import { type LayerName, config } from "src/data/config";
    import Tooltip from "src/lib/reusable/Tooltip.svelte";
    import showWelcomeIcon from "src/assets/show-welcome.svg";
    import { createEventDispatcher } from "svelte";
    export let activeLayer: LayerName;
    export let opacity: number;
    const dispatch = createEventDispatcher();

    const signaturesUrl: string = "https://urbangrammarai.xyz/story/#ss";

    function changeLayer() {
        dispatch("changeLayer", {});
    }
    function changeOpacity() {
        dispatch("changeOpacity", {});
    }
</script>

<div id="indicators">
    <div class="category-first">Land use</div>
    {#each [...config.allInputs.entries()] as [inputName, input]}
        <label id={inputName + "-label"}
            ><input
                bind:group={activeLayer}
                type="radio"
                on:change={changeLayer}
                value={inputName}
            />{input.short}
        </label>
        {#if inputName === "signature_type"}
            <Tooltip --width="140px">
                <a
                    id="sig-descriptions"
                    slot="content"
                    href={signaturesUrl}
                    target="_blank"
                >
                    <img
                        src={showWelcomeIcon}
                        alt="A link to descriptions of spatial signatures on the Urban Grammar website."
                    />
                </a>

                <span slot="description"
                    >View descriptions on the Urban Grammar website</span
                >
            </Tooltip>
        {/if}
        <br />
    {/each}

    <div class="category-second">Indicators</div>
    {#each [...config.allIndicators.entries()] as [indiName, indi]}
        <label id={indiName + "-label"}
            ><input
                bind:group={activeLayer}
                type="radio"
                on:change={changeLayer}
                value={indiName}
            />{indi.short}
        </label>
        <br />
    {/each}

    <div id="opacity-slider">
        Opacity:
        <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            bind:value={opacity}
            on:input={changeOpacity}
        />
    </div>
</div>

<style>
    input[type="range"] {
        display: inline-block;
        vertical-align: middle;
        width: 140px;
    }

    a#sig-descriptions {
        display: inline-block;
        background-color: #ffffff;
        width: 15px;
        height: 15px;
        transform: translateY(2px);
    }
    a#sig-descriptions:hover {
        background-color: #dddddd;
    }

    a#sig-descriptions > img {
        width: 100%;
        height: 100%;
    }

    div#indicators {
        /* Hardcoded width matches the width of the chart div so that the right
         * sidebar width doesn't change when charts are shown/hidden. */
        width: 225px;
        max-width: 225px;
        line-height: 20px;
    }

    div#indicators > label > input[type="radio"] {
        vertical-align: baseline;
        margin-left: 10px;
        margin-right: 10px;
    }

    div#opacity-slider {
        margin-top: 10px;
    }

    div.category-first {
        margin-bottom: 5px;
        font-style: italic;
    }

    div.category-second {
        margin-top: 5px;
        margin-bottom: 5px;
        font-style: italic;
    }
</style>
