import { defineComponent } from '../c-mp/fun/defineComponent'
import { useState } from '../c-mp/fun/useState'
import './ClassTestComp.css'

export const ClassTestComp = defineComponent<{}>(
	'ClassTestComp',
	(props, $) => {
		const state = useState('state', { isSky: false })

		$.append(
			<>
				<div class='sky bold'>String SKY</div>
				<div class='crimson bold'>String CRIMSON</div>
				<div class={['sky bold', 'italic']}>Array SKY</div>

				<div class={() => (state.isSky ? 'sky bold' : 'crimson bold')}>
					Reactive string {() => (state.isSky ? 'sky' : 'crimson')}
				</div>
				<div
					class={() => [
						'bold',
						state.isSky && 'sky',
						!state.isSky && 'crimson',
					]}
				>
					Reactive array {() => (state.isSky ? 'sky' : 'crimson')}
				</div>

				<button
					onclick={() => {
						state.isSky = !state.isSky
					}}
				>
					Toggle reactive
				</button>
			</>,
		)

		return $
	},
)
